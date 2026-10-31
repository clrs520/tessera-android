package com.tdashcam.studio

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.os.SystemClock
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.Executors

/**
 * Still frames for the event list and the trim filmstrip, decoded in this process.
 *
 * The page can pull a frame out of a clip by itself — a throwaway `<video>`, a seek, a canvas
 * readback — but on Android the WebView owns a handful of hardware decoder slots and the
 * six-camera player is holding every one of them. A seventh decoder then queues behind the whole
 * pipeline: a seek that costs a fifth of a second on an empty player costs the full fetch timeout
 * while an event is loaded, which is exactly when the filmstrip asks. `MediaMetadataRetriever`
 * decodes in this process instead, so it never queues for a WebView slot.
 *
 * One worker thread on purpose: the retriever is not reentrant, and the frames are a background
 * nicety that should never outrank playback or export for a core.
 */
class ThumbFetcher(
    private val context: android.content.Context,
    private val publish: (id: String, dataUrl: String?) -> Unit,
) {
    private val executor = Executors.newSingleThreadExecutor()
    private var writesSinceSweep = 0

    /**
     * R206 — 页面重建会换一个 ThumbFetcher，而这条线程不是守护线程：没人关它就一直留着，
     * 每次重建多一条（改系统字号、切换语言、深浅色跟随系统都会重建）。帧是后台的锦上添花，
     * 关掉排队里的活儿不会丢任何东西 —— 下一次要图就直接重新解。
     */
    fun close() {
        runCatching { executor.shutdownNow() }
    }

    fun request(id: String, path: String, millis: Long, width: Int) {
        executor.execute {
            val t0 = SystemClock.elapsedRealtime()
            // R193 — 解出来的帧落盘：一次启动里滚过的每一行，下次启动还得再解一遍，而一条 320 px
            // 帧在 4K 源上要 0.4 s。命中磁盘的那一次只要读 8 KB + base64，几十毫秒。
            val key = cacheKey(path, millis, width)
            val cached = readCached(key)
            val value = cached ?: runCatching { extract(path, millis, width) }
                .getOrNull()
                ?.also { writeCached(key, it) }
            Log.i(TAG, "$id ${when {
                value == null -> "FAILED"
                cached != null -> "disk"
                else -> "ok"
            }} in ${SystemClock.elapsedRealtime() - t0}ms $path@$millis")
            publish(id, value)
        }
    }

    private fun cacheDir(): File =
        File(context.cacheDir, "thumbs").apply { if (!isDirectory) mkdirs() }

    /**
     * Keyed on the clip's length and mtime as well as the ask: a clip that was overwritten with a
     * different file must not inherit the old picture.
     */
    private fun cacheKey(path: String, millis: Long, width: Int): String {
        val file = File(path)
        val raw = "$path|$millis|$width|${file.length()}:${file.lastModified()}"
        val digest = java.security.MessageDigest.getInstance("SHA-1").digest(raw.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }.take(32)
    }

    private fun readCached(key: String): String? {
        return runCatching {
            val file = File(cacheDir(), "$key.jpg")
            if (!file.isFile || file.length() <= 0) return null
            "data:image/jpeg;base64," + Base64.encodeToString(file.readBytes(), Base64.NO_WRAP)
        }.getOrNull()
    }

    private fun writeCached(key: String, dataUrl: String) {
        runCatching {
            val comma = dataUrl.indexOf(',')
            if (comma < 0) return
            val bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT)
            if (bytes.isEmpty()) return
            val target = File(cacheDir(), "$key.jpg")
            val tmp = File(cacheDir(), "$key.tmp")
            tmp.writeBytes(bytes)
            if (!tmp.renameTo(target)) {
                target.delete()
                tmp.renameTo(target)
            }
            // A sweep every few hundred frames, not every write: the directory scan is the only
            // expensive part and one pass per ~2 MB written is nothing.
            if (++writesSinceSweep >= SWEEP_EVERY) {
                writesSinceSweep = 0
                sweep()
            }
        }
    }

    /** Keep the folder under its budget, oldest first. The system may clear `cacheDir` anyway. */
    private fun sweep() {
        runCatching {
            val files = cacheDir().listFiles()?.filter { it.isFile } ?: return
            var total = files.sumOf { it.length() }
            if (total <= CAP_BYTES) return
            files.sortedBy { it.lastModified() }.forEach { file ->
                if (total <= CAP_BYTES) return@forEach
                total -= file.length()
                file.delete()
            }
        }
    }

    private fun extract(path: String, millis: Long, width: Int): String? {
        // Only ever a video the page already listed; anything else is a bug upstream, not a
        // request to serve.
        if (!path.endsWith(".mp4", ignoreCase = true)) return null
        val retriever = MediaMetadataRetriever()
        try {
            retriever.setDataSource(path)
        } catch (e: Exception) {
            Log.w(TAG, "open $path", e)
            runCatching { retriever.release() }
            return null
        }
        try {
            // A time past the last frame is not a free ask: the retriever decodes to the end of the
            // file to prove there is nothing closer. The timeline is a grid of nominal one-minute
            // segments and the file behind one can be shorter than its slot — and right at the end
            // of a file some decoders answer `null` rather than the last picture, so a frame that
            // misses falls back to the opening one. A slightly wrong frame still beats an empty
            // cell in a filmstrip whose whole job is orientation.
            val durationMs = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                ?.toLongOrNull() ?: Long.MAX_VALUE
            val micros = millis.coerceIn(0, (durationMs - 1500).coerceAtLeast(0)) * 1000
            // `getFrameAtTime` already turns the picture by the container's rotation, so no
            // `METADATA_KEY_VIDEO_ROTATION` handling belongs here: the JNI has folded that flag into
            // the pixels since API 24 (`android_media_MediaMetadataRetriever.cpp` calls `rotate()`
            // for 0/90/180/270), and measured on API 36 one bitstream declared at 90/180/270 comes
            // back turned by each of them. A second turn here would put the thumbnail on its side.
            val frame = retriever.getFrameAtTime(micros, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                ?: retriever.getFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                ?: return null
            val wanted = width.coerceIn(32, 640)
            val scaled = if (frame.width > wanted) {
                Bitmap.createScaledBitmap(
                    frame, wanted, (frame.height.toLong() * wanted / frame.width).toInt().coerceAtLeast(1), true
                )
            } else frame
            val bytes = ByteArrayOutputStream()
            if (!scaled.compress(Bitmap.CompressFormat.JPEG, 70, bytes)) return null
            return "data:image/jpeg;base64," + Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.w(TAG, "extract $path@$millis", e)
            return null
        } finally {
            runCatching { retriever.release() }
        }
    }

    private companion object {
        const val TAG = "ThumbFetcher"
        /** 64 MB ≈ 8 000 frames at 8 KB — more than a 2 525-event drive shows in one sweep. */
        const val CAP_BYTES = 64L * 1024 * 1024
        const val SWEEP_EVERY = 200
    }
}
