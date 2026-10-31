package com.tdashcam.studio.export

import android.opengl.EGL14
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaCodecList
import android.media.MediaFormat
import android.os.Build
import android.os.SystemClock
import android.media.MediaMuxer
import android.util.Log
import android.view.Surface
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

internal data class SegmentSpec(
    val path: String,
    val clipStartUs: Long,
    val clipEndUs: Long,
    val globalStartUs: Long,
)

/**
 * @param rect where the view sits in the output frame, as `[x, y, w, h]` in fractions of the
 *   frame with `y` measured **down from the top** — the same convention the page's layout preview
 *   uses, so the two cannot disagree about which way is up. Null falls back to `cellIndex` in the
 *   preset grid, which is what every request from before the layout editor looks like.
 * @param mosaic the same kind of box, but measured against **that view's own picture** rather than
 *   the frame, so a privacy box keeps covering the same licence plate however the views are
 *   rearranged afterwards.
 */
internal data class CameraSpec(
    val camera: String,
    val cellIndex: Int,
    val rect: List<Float>?,
    val mosaic: List<List<Float>>,
    val segments: List<SegmentSpec>,
    val label: String = "",
    val triggered: Boolean = false,
    val trigger: String = "",
)

/**
 * The two static marks, asked for separately because they answer different questions: 「哪一路」 and
 * 「哪几路当时触发了」. Both are per-view and neither changes with the second being encoded, which is
 * why they are one bitmap rather than a per-second entry like [CaptionSpec].
 */
internal data class ChromeSpec(
    val label: Boolean = false,
    val badge: Boolean = false,
)

/**
 * One watermark reading for the whole frame, in force from `us` until the next entry. The fields are
 * named rather than one joined string because they are four different sizes and weights — the speed
 * is the one number the eye is meant to catch — and a renderer cannot style what it cannot tell
 * apart. Empty means "not asked for", `bar` below zero means no bar this second.
 */
internal data class CaptionSpec(
    val us: Long,
    val clk: String = "",
    val spd: String = "",
    val bar: Float = -1f,
    val gps: String = "",
    val st: String = "",
    val src: String = "",
)

/**
 * The export job itself: N camera streams composited into one H.264 encoder fed through an EGL
 * window surface, muxed straight into an MP4 in the Downloads directory.
 *
 * The output clock is entirely synthetic — one frame every `1/fps` seconds, stamped with
 * `eglPresentationTimeANDROID` — so the file's duration and frame count are exact even when the
 * decoders (or the emulator's software GL) run slower than real time. Nothing here uses wall-clock
 * pacing, which is why a 4-camera minute on a phone takes minutes but still yields 60 seconds.
 *
 * There is deliberately no audio track: Tesla dashcam recordings have none, and an empty audio
 * track makes the file show up as broken in some galleries.
 */
class ExportEngine {
    fun interface ProgressListener {
        fun onProgress(payloadJson: String)
    }

    private val nextId = AtomicLong(1)
    private var running: Job? = null

    fun isBusy(): Boolean = running != null

    /** The id of the job being encoded, or 0 when idle. A terminal payload is published after the
     * engine clears this, so 0 there means "the job that just ended", not "no story". */
    fun runningId(): Long = synchronized(this) { running?.request?.id } ?: 0L

    /**
     * @param requestJson the job description from the page; see `startExport` in `script.js` for
     *   the field list.
     * @return the job id, or -1 when a job is already running (the page must not queue blind).
     */
    fun start(requestJson: String, listener: ProgressListener): Long {
        val request = try {
            Request.parse(requestJson)
        } catch (e: Exception) {
            // A refusal with a reason of its own (`tooLong`) must keep it; flattening every parse
            // failure into 「bad request」 would tell the user their numbers were wrong when the clip
            // is simply longer than one run may be.
            val spec = e as? ExportException
            listener.onProgress(errorPayload(0L, spec?.code?.takeIf { it.isNotEmpty() } ?: "badRequest",
                e.message ?: e.javaClass.simpleName, spec?.args ?: emptyMap()))
            return -1
        }
        synchronized(this) {
            if (running != null) {
                listener.onProgress(errorPayload(request.id, "busy"))
                return -1
            }
            val job = Job(request, listener)
            running = job
            Thread({ run(job) }, "tdashcam-export").apply {
                priority = Thread.MAX_PRIORITY
                start()
            }
        }
        return request.id
    }

    fun cancel(id: Long) {
        val job = synchronized(this) { running } ?: return
        if (id == 0L || id == job.request.id) job.cancelled.set(true)
    }

    /** What the codecs on this device actually are; shown in the export panel's diagnostics. */
    fun describeCodecs(width: Int, height: Int): String {
        val list = MediaCodecList(MediaCodecList.REGULAR_CODECS)
        val decoders = list.codecInfos.filter { !it.isEncoder && supports(it, "video/avc") }.map { it.name }
        val encoders = list.codecInfos.filter { it.isEncoder && supports(it, "video/avc") && sizeOk(it, "video/avc", width, height) }
            .map { it.name }
        return "decoders=${decoders.joinToString(",")}; encoders=${encoders.joinToString(",")}"
    }

    /**
     * Which codecs the list claims to have, and which ones the process can actually create.
     * `MediaCodecList` is a description of `media_codecs.xml`, not of what is reachable at runtime:
     * an emulator or a vendor image will happily list a codec whose service is not answering, and
     * the only way to tell that apart from "your parameters were wrong" is to try instantiating it.
     */
    fun probeCodecs(): String {
        val list = MediaCodecList(MediaCodecList.REGULAR_CODECS)
        val parts = ArrayList<String>()
        for (info in list.codecInfos) {
            val mime = "video/avc"
            val caps = runCatching { info.getCapabilitiesForType(mime) }.getOrNull() ?: continue
            val kind = if (info.isEncoder) "enc" else "dec"
            val probed = if (kind == "enc") sizeOk(info, mime, 1280, 720) else true
            val verdict = runCatching {
                MediaCodec.createByCodecName(info.name).release()
                "ok"
            }.getOrElse { "no:${it.message?.take(40) ?: it.javaClass.simpleName}" }
            parts += "$kind ${info.name}${if (probed) "" else " (size?)"}=$verdict"
        }
        return "hw=${Build.HARDWARE} bis=${Build.SUPPORTED_ABIS.joinToString("/")}; " +
            parts.joinToString("; ")
    }

    private fun supports(info: MediaCodecInfo, mime: String) =
        runCatching { info.getCapabilitiesForType(mime) }.getOrNull() != null

    private fun sizeOk(info: MediaCodecInfo, mime: String, width: Int, height: Int): Boolean {
        val caps = runCatching { info.getCapabilitiesForType(mime) }.getOrNull() ?: return false
        return caps.videoCapabilities?.isSizeSupported(width, height) ?: true
    }

    private class Job(val request: Request, val listener: ProgressListener) {
        val cancelled = AtomicBoolean(false)
        var lastReportAt = 0L
    }

    // ---- the worker --------------------------------------------------------------------------------

    private fun run(job: Job) {
        val request = job.request
        var gl: GlRenderer? = null
        var encoder: MediaCodec? = null
        var inputSurface: Surface? = null
        var muxer: MediaMuxer? = null
        var overlay: CaptionOverlay? = null
        var chrome: ChromeOverlay? = null
        val streams = ArrayList<CameraStream>()
        // R138: never truncate an existing clip. The page's name carries the range and preset but
        // not the camera set or the overlay switches, so two legal exports can collide; the muxer
        // would silently overwrite the first one. A suffix keeps both files and both history rows.
        val outputFile = uniqueOutputFile(File(request.outPath))
        // R206 — 容器开在成品名旁边加 `.part` 的路径上，成功（或取消但值得留）之后才改名。
        // MediaMuxer 只认路径不认文件名，改名不动它写过的字节。
        val partFile = File("${outputFile.absolutePath}.part")
        var failure: String? = null
        var tailNote: String? = null
        // Which code the page should put words against, and the numbers its sentence needs. The
        // sentences above stay English because they are what the log and the diagnostics quote;
        // everything the user reads is composed on the page from these two.
        var failureCode = ""
        var failureArgs: Map<String, Any> = emptyMap()
        var tailCode = ""
        var tailArgs: Map<String, Any> = emptyMap()
        var framesWritten = 0
        // Which views ever handed the compositor a texture. A run where none did has written a file
        // full of nothing but overlays — the encoder is happy, the muxer is happy, and the picture a
        // decoder refused to produce is the only thing missing. `framesWritten` cannot see that.
        var paintedOnce = BooleanArray(0)

        try {
            outputFile.parentFile?.mkdirs()
            report(job, "preparing", 0f, "preparing")

            // The codec list is a description of the image, not a promise: a name in it can still
            // refuse to start, so every candidate gets a real attempt and the reason is kept for the
            // error message.
            var encoderName = ""
            val rejected = StringBuilder()
            for (candidate in encoderCandidates(request)) {
                val instance = try {
                    MediaCodec.createByCodecName(candidate)
                } catch (e: Exception) {
                    rejected.append("$candidate: ${e.message}; ")
                    continue
                }
                try {
                    instance.configure(
                        videoFormat(request, candidate), null, null, MediaCodec.CONFIGURE_FLAG_ENCODE
                    )
                    encoder = instance
                    inputSurface = instance.createInputSurface()
                    encoderName = candidate
                    break
                } catch (e: Exception) {
                    runCatching { instance.release() }
                    rejected.append("$candidate: ${e.message}; ")
                }
            }
            if (encoder == null || inputSurface == null) {
                throw ExportException("no H.264 encoder can do ${request.width}x${request.height}: $rejected",
                    code = "noEncoder",
                    args = mapOf("w" to request.width, "h" to request.height))
            }
            // Locals for the rest of the job: the nullable vars above only exist so `finally` can
            // clean up whatever got as far as being created.
            val encoderCodec = encoder!!
            // `gl` 必须在 `init()` 之前就指向 renderer：任何一步 EGL 失败都会跳过下面那行赋值，
            // 而 `finally` 只释放 `gl` 指到的东西 —— 之前创建的 display/context/surface 会一直泄漏，
            // 反复失败（4K、六路）能把驱动的 context 配额耗光。
            val renderer = GlRenderer(inputSurface!!)
            gl = renderer
            renderer.init()
            renderer.debugCalls = EARLY_DEBUG_CALLS
            if (renderer.surfaceWidth != request.width || renderer.surfaceHeight != request.height) {
                Log.w(TAG, "surface is ${renderer.surfaceWidth}x${renderer.surfaceHeight}, asked for ${request.width}x${request.height}")
            }

            muxer = MediaMuxer(partFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)

            for (camera in request.cameras) {
                streams += CameraStream(camera.camera, camera.cellIndex, camera.rect, camera.mosaic,
                    camera.segments, renderer, request.decoderName, request.preferHardware)
            }
            // Built from the surface's own pixels, because that is the canvas the strip is measured
            // against; an encoder that quietly resized the surface would otherwise reposition it.
            if (request.captions.isNotEmpty() && renderer.surfaceWidth > 0 && renderer.surfaceHeight > 0) {
                overlay = CaptionOverlay(renderer, renderer.surfaceWidth, renderer.surfaceHeight,
                    request.captions, request.wm)
            }
            encoderCodec.start()

            val frameIntervalUs = (1_000_000L / request.fps).coerceAtLeast(1L)
            val totalFrames = ((request.durationUs + frameIntervalUs - 1) / frameIntervalUs).coerceAtLeast(1L)
            val bufferInfo = MediaCodec.BufferInfo()
            var trackIndex = -1
            var encoderDone = false
            var step = 0L
            // Where the composited frames actually painted, as fractions from the top. Only the
            // watermark's `auto` anchor reads them, and only once, when every view has contributed.
            var paintedSent = false
            var paintedTop = 1f
            var paintedBottom = 0f
            paintedOnce = BooleanArray(streams.size)
            // Where each view's picture sits, kept across frames: a decoder that posts its first
            // frame after the chrome latch still has a known geometry, and a plate must not depend
            // on which frame happened to be the latch frame.
            val cellsKnown = HashMap<Int, Cell>(streams.size)
            var chromeCells = 0

            // 硬件解码器的首帧是投到主线程的，不是投给这个循环。0.2s 的片段只有六帧，可能在回调
            // 落地前就跑完 —— 于是每一路都被判成「从没交出画面」，整个文件被当黑片删掉。先给解码器
            // 一次有界的预热，再判第 0 帧。
            for (stream in streams) runCatching { stream.advanceTo(0L) }
            val warmUntil = SystemClock.elapsedRealtime() + 600
            while (SystemClock.elapsedRealtime() < warmUntil && streams.any { !it.hasPostedFrame() }) {
                Thread.sleep(10)
            }

            report(job, "encoding", 0f, "encoding", args = mapOf(
                "n" to streams.size, "w" to request.width, "h" to request.height,
                "frames" to totalFrames, "encoder" to encoderName))

            while (step < totalFrames) {
                if (job.cancelled.get()) break
                val globalUs = step * frameIntervalUs
                renderer.clear()

                var paintedThisFrame = 0
                for ((streamIndex, stream) in streams.withIndex()) {
                    // A hand-placed rect wins over the preset slot; either way the frame is
                    // *contained*, so repositioning can never introduce a crop or a squash.
                    val slot = stream.rect?.takeIf { it.size == 4 }?.let { Cell.of(it) }
                        ?: Cell.grid(request.rows, request.cols, stream.cellIndex)
                    // Geometry is known as soon as the decoder reports a size — long before the
                    // chrome latch, and independent of whether this particular frame drew it.
                    if (paintedOnce[streamIndex] && stream.displayWidth > 0 && stream.displayHeight > 0) {
                        cellsKnown[streamIndex] = Cell.contain(slot,
                            stream.displayWidth, stream.displayHeight, renderer.frameAspect)
                    }
                    // `advanceTo` 为 false = 这一拍落在「缺了一分钟文件」的空洞里。必须 leave the hole：
                    // 以前忽略返回值，`hasFrame` 又是永久 latch，于是上一段最后一帧被当成这一拍继续画，
                    // 导出的「证据」里出现整整一分钟的静止画面。
                    if (!stream.advanceTo(globalUs)) continue
                    if (!stream.updateTexImage()) continue
                    paintedOnce[streamIndex] = true
                    val cell = cellsKnown[streamIndex] ?: Cell.contain(slot,
                        stream.displayWidth, stream.displayHeight, renderer.frameAspect)
                    // The first composited frame says where the picture actually is, which is the
                    // only thing the watermark's `auto` anchor can be trusted to read: a portrait
                    // view in a landscape cell leaves bars, and a stamp inside a bar is free.
                    if (!paintedSent) {
                        paintedTop = minOf(paintedTop, (1f - cell.top) / 2f)
                        paintedBottom = maxOf(paintedBottom, (1f - cell.bottom) / 2f)
                        paintedThisFrame += 1
                    }
                    renderer.drawTexture(stream.textureId, stream.transform(),
                        cell.left, cell.bottom, cell.right, cell.top,
                        stream.mosaicUniforms)
                }
                // Latched once every view has contributed, or after two frames — whichever comes
                // first. A stream whose decoder never hands over a frame is a thing the engine
                // itself announces (`有 N 路全程没有画面` below), and holding the anchor back for it
                // used to mean the watermark and every camera plate joined the file only on its very
                // last frame, silently: the empty sentinel — top 1.0, bottom 0.0 — reads to `auto` as
                // "everything below is free", which parked the stamp across the middle of the file.
                // Only `auto` waits: the other anchors are decided without it, and holding them back
                // would cost frames nobody asked to delay.
                if (!paintedSent && (paintedThisFrame == streams.size
                        || step >= minOf(totalFrames - 1, PAINT_LATCH_FRAMES))) {
                    paintedSent = true
                    overlay?.setPaintedArea(paintedTop, paintedBottom)
                    // Built here rather than before the loop because a name has to sit on the
                    // view's *picture*, and only a composited frame says where that is. The cost is
                    // that the marks join the file a frame or two in — the same head-of-file wait
                    // the `auto` anchor already accepts, and only for whoever turns them on.
                    chrome = runCatching { buildChrome(request, streams, cellsKnown, renderer) }
                        .onFailure { Log.w(TAG, "chrome overlay: ${it.message}") }
                        .getOrNull()
                    chromeCells = if (chrome != null) cellsKnown.size else 0
                    if (chrome == null && (request.chrome.label || request.chrome.badge)) {
                        // Asked for and not drawn is the one failure this layer can have silently, so
                        // it says so: a stream that never produced a frame leaves no plate to build.
                        Log.w(TAG, "chrome requested but not built: cells=${cellsKnown.size} "
                            + "streams=${streams.size} painted=$paintedThisFrame")
                    }
                }
                // A view whose decoder reports its picture size after the latch frame still gets its
                // plate: the overlay is rebuilt once per newly known cell (at most one per stream),
                // instead of staying frozen with whichever cells existed on that one frame.
                if (paintedSent && (request.chrome.label || request.chrome.badge)
                    && cellsKnown.size > chromeCells) {
                    val next = runCatching { buildChrome(request, streams, cellsKnown, renderer) }.getOrNull()
                    if (next != null) {
                        chrome?.close()
                        chrome = next
                        chromeCells = cellsKnown.size
                    }
                }
                // Under the stamp: a triggered view's outline and its own name belong to the tile,
                // and where the two meet the figures about the car are the thing to keep readable.
                chrome?.draw()
                if (paintedSent || request.wm.place != "auto") overlay?.draw(globalUs)

                renderer.setPresentationTime(globalUs)
                if (!renderer.swap()) {
                    val error = lastEglError()
                    if (error == EGL14.EGL_CONTEXT_LOST) {
                        throw ExportException("GPU context lost (screen off, or out of memory)", code = "gpuLost")
                    }
                    throw ExportException("eglSwapBuffers failed: $error")
                }
                framesWritten++

                trackIndex = drainEncoder(encoderCodec, muxer, bufferInfo, trackIndex, false)
                step++
                if (step % PROGRESS_EVERY_FRAMES == 0L || step == totalFrames) {
                    report(job, "encoding", step.toFloat() / totalFrames.toFloat(), "progress",
                        args = mapOf("step" to step, "frames" to totalFrames))
                }
            }

            if (!job.cancelled.get()) {
                encoderCodec.signalEndOfInputStream()
                // signalEndOfInputStream is asynchronous: a codec that is still finishing a GOP
                // answers TRY_AGAIN_LATER for a while, which is not the same as being stuck. The
                // grace has to cover whatever is still *inside* the encoder, so it is measured in
                // wall-clock rather than in polls — a software encoder that needed minutes for the
                // clip can need tens of seconds to flush, and 300ms of polls called that a failure.
                val tailDeadline = android.os.SystemClock.uptimeMillis() + TAIL_GRACE_MS
                var stuck = false
                while (!encoderDone) {
                    val index = encoderCodec.dequeueOutputBuffer(bufferInfo, TAIL_POLL_US)
                    when {
                        index >= 0 -> {
                            encoderDone = bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
                            if (trackIndex < 0) trackIndex = addTrack(muxer, encoderCodec, bufferInfo)
                            if (trackIndex >= 0 && bufferInfo.size > 0 &&
                                bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0
                            ) {
                                encoderCodec.getOutputBuffer(index)?.let { buffer ->
                                    buffer.position(bufferInfo.offset)
                                    buffer.limit(bufferInfo.offset + bufferInfo.size)
                                    muxer.writeSampleData(trackIndex, buffer, bufferInfo)
                                }
                            }
                            encoderCodec.releaseOutputBuffer(index, false)
                        }
                        index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                            trackIndex = addTrack(muxer, encoderCodec, bufferInfo)
                        }
                        index == MediaCodec.INFO_TRY_AGAIN_LATER -> {
                            if (android.os.SystemClock.uptimeMillis() > tailDeadline) {
                                stuck = true
                                break
                            }
                        }
                        else -> { /* INFO_OUTPUT_BUFFERS_CHANGED: ignored, buffers are queried per call */ }
                    }
                }
                // Every frame had already been handed over, so a silent encoder costs the last few
                // frames, not the file. Throwing here would discard a good export; the muxer still
                // gets stopped below and the note rides along on an otherwise successful job.
                if (stuck) {
                    if (trackIndex < 0) throw ExportException("the encoder produced no frame; ${request.width}x${request.height} may be beyond it",
                        code = "noFrames", args = frameArgs(request))
                    tailNote = "encoder went silent at the tail"
                    tailCode = "tailStuck"
                    tailArgs = mapOf("frames" to framesWritten)
                    Log.w(TAG, tailNote)
                }
            } else {
                // A cancelled job still gets a playable file: flush what the encoder already made.
                var guard = 0
                while (guard++ < 200) {
                    val index = encoderCodec.dequeueOutputBuffer(bufferInfo, 0)
                    if (index >= 0) {
                        if (trackIndex < 0) trackIndex = addTrack(muxer, encoderCodec, bufferInfo)
                        // R85: same two rules as the live drain below. A config buffer is not a frame —
                        // `writeSampleData` with it as the first sample produces a file the gallery
                        // opens to zero length.
                        if (trackIndex >= 0 && bufferInfo.size > 0 &&
                            bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0
                        ) {
                            encoderCodec.getOutputBuffer(index)?.let { buffer ->
                                buffer.position(bufferInfo.offset)
                                buffer.limit(bufferInfo.offset + bufferInfo.size)
                                muxer.writeSampleData(trackIndex, buffer, bufferInfo)
                            }
                        }
                        encoderCodec.releaseOutputBuffer(index, false)
                    } else if (index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                        // R85: this is a *step* of the handshake, not the end of the queue. Cancelling
                        // inside the first instants means the track is still -1 here, and the old
                        // `if (index < 0) break` dropped out and threw "编码器没有产出一帧" — deleting the
                        // partial file the page had just been promised 「已写入的片段保存在文件里」.
                        if (trackIndex < 0) trackIndex = addTrack(muxer, encoderCodec, bufferInfo)
                    } else {
                        break
                    }
                }
            }

            if (trackIndex >= 0) {
                muxer.stop()
            } else {
                throw ExportException("the encoder produced no frame; ${request.width}x${request.height} may be beyond it",
                code = "noFrames", args = frameArgs(request))
            }
        } catch (e: Throwable) {
            // R143: `Exception` did not cover an `Error`, and the one this pipeline actually meets
            // is the OOM a `Bitmap.createBitmap` throws on a six-view 4K surface. The thread died
            // after `finally` had already cleared `running`, so no terminal payload was ever
            // published — the page kept a job the engine no longer had, showed only 「取消」, and
            // cancelling answered nothing at all.
            failure = e.message ?: e.javaClass.simpleName
            // 没有 code 的失败只能让页面回落成 `message` —— 也就是把英文 Java 异常直接糊到中文界面上。
            // 把最常见、也最需要人话的三类认出来，其余给一个通用码。
            //
            // R153: 先认抛出方自己带的 code。以前这里只看文本，`noEncoder`/`gpuLost`/`noDecoder`/
            // `formatChanged` 和 `missingSource` 都被压成 `generic`，页面上那几句已有译文成了死字符串。
            val spec = e as? ExportException
            val text = (e.message ?: "").uppercase()
            failureCode = spec?.code?.takeIf { it.isNotEmpty() } ?: when {
                text.contains("ENOSPC") || text.contains("NO SPACE") -> "diskFull"
                text.contains("EACCES") || text.contains("EPERM") || e is java.io.FileNotFoundException -> "noWriteAccess"
                e is IllegalArgumentException -> "badSize"
                else -> "generic"
            }
            failureArgs = spec?.args ?: emptyMap()
            Log.w(TAG, "export failed", e)
            runCatching { if (failure != null) muxer?.stop() }
        } finally {
            streams.forEach { runCatching { it.close() } }
            runCatching { encoder?.stop() }
            runCatching { encoder?.release() }
            runCatching { inputSurface?.release() }
            // The texture it holds belongs to the GL context, so it goes before the context does.
            runCatching { overlay?.close() }
            runCatching { chrome?.close() }
            runCatching { gl?.release() }
            runCatching { muxer?.release() }
            synchronized(this) { if (running === job) running = null }
        }

        val size = if (partFile.exists()) partFile.length() else 0L
        if (failure == null && size == 0L) { failure = "the file came out empty"; failureCode = "emptyFile" }
        // A file with no picture in it is not a finished export, whatever the encoder said: the muxer
        // closes happily over a strip of overlays on a black surface. Say so, and let the cleanup
        // below take the container away with it rather than leaving a black .mp4 in Download.
        val dark = paintedOnce.count { !it }
        if (failure == null && paintedOnce.isNotEmpty() && dark == paintedOnce.size) {
            failure = "${paintedOnce.size} decoder(s) never produced a picture; only the overlays are in the file"
            failureCode = "darkAll"
            failureArgs = mapOf("n" to paintedOnce.size)
        } else if (failure == null && dark > 0) {
            tailNote = listOfNotNull(tailNote, "$dark view(s) had no picture at all").joinToString("; ")
            tailCode = "darkSome"
            tailArgs = mapOf("n" to dark)
        }
        // A cancel is not a failure, whatever threw on the way out — and the code must go with the
        // sentence, or the page puts 「no encoder」 words on a job the user stopped by hand.
        if (failure != null && job.cancelled.get()) {
            failure = null
            failureCode = ""
            failureArgs = emptyMap()
        }
        // A job that wrote nothing still leaves behind the container MediaMuxer opened for it, and a
        // 0-byte .mp4 in Download that the gallery offers to open is worse than no file at all.
        // R138: an all-dark run encodes real black frames, so `size` is not zero and the old check
        // left the orphan behind. A failure means nobody can use this file; a cancel with bytes is
        // the one case the toast promises to keep ("已写入的片段保存在文件里").
        // 只有**真的写出过帧**的容器才值得留。`size > 0` 不算：MediaMuxer 一 start 就会写下 ftyp，
        // 用户在头几百毫秒里取消，留下的是一个没有 moov 的空壳 —— 相册里显示 0 秒、点开就报错，
        // 还会被 JS 侧扫进「最近导出」。取消时那句话承诺的是「已写入的片段」，不是「文件存在」。
        val keep = framesWritten > 0 && size > 0L && !(failure != null && !job.cancelled.get())
        // R206 — 「值得留」才改名成成品名，其余一律把这个半截容器删掉。
        // 交付的那一刻才是承诺：之前它一直叫 `<name>.mp4.part`，所以进程被半路杀掉（低内存、系统停
        // 服务、用户上滑划掉）留下的是相册认不出的 `.part`，而不是一个没有 moov、点开报错、还会被
        // 「最近导出」扫进列表的正式 .mp4。
        var keptPath = ""
        if (keep) {
            // `renameTo` 在目标已经存在时返回 false —— 起跑那一次 `uniqueOutputFile` 查过没有，
            // 但下载目录不是我们独占的（相机、浏览器、别的 APP 都会往里写）。
            // 这时候要的是**再要一个不冲突的名**，不是把占着那个名的文件删掉：
            // 抹掉别人（或上一单）已经写好的成品，比多一个「(2)」严重得多。
            val direct = runCatching { partFile.renameTo(outputFile) }.getOrDefault(false)
            val target = if (direct) outputFile else uniqueOutputFile(outputFile)
            val renamed = direct || runCatching { partFile.renameTo(target) }.getOrDefault(false)
            if (renamed && target.isFile) keptPath = target.absolutePath
            else {
                runCatching { partFile.delete() }
                failure = "the finished file could not be moved into place"
                failureCode = "renameFailed"
                failureArgs = emptyMap()
            }
        } else {
            runCatching { partFile.delete() }
        }

        val payload = JSONObject().apply {
            put("id", request.id)
            put("phase", if (job.cancelled.get()) "cancelled" else if (failure == null) "done" else "error")
            put("percent", if (failure == null) 100 else 0)
            put("frames", framesWritten)
            put("path", keptPath)
            put("bytes", if (keptPath.isNotEmpty()) size else 0L)
            put("message", failure ?: if (job.cancelled.get()) {
                if (keep) "cancelled, the written part is kept" else "cancelled"
            } else (tailNote ?: ""))
            put("code", failureCode.ifEmpty { tailCode.ifEmpty { if (job.cancelled.get())
                (if (keep) "cancelledKept" else "cancelled") else "" } })
            (failureArgs.ifEmpty { tailArgs }).forEach { (key, value) -> put(key, value) }
        }
        job.listener.onProgress(payload.toString())
    }

    /**
     * R138: `name.mp4` → `name (2).mp4` … until the path is free. The page's own name cannot tell two
     * camera sets or two overlay switch combinations apart, and MediaMuxer truncates its target, so
     * the only safe place to decide is here, immediately before the file is opened.
     */
    private fun uniqueOutputFile(requested: File): File {
        if (!requested.exists()) return requested
        val parent = requested.parentFile ?: return requested
        val base = requested.nameWithoutExtension
        val ext = requested.extension.let { if (it.isEmpty()) "" else ".$it" }
        var n = 2
        while (true) {
            val candidate = File(parent, "$base ($n)$ext")
            if (!candidate.exists()) return candidate
            n += 1
        }
    }

    /**
     * The camera names and the trigger outlines, as one plate over the whole frame.
     *
     * Nothing is guessed here: the cells are the ones the first complete frame composited, so a name
     * lands on the same contained picture the shader drew, and a job whose streams never all produced
     * a frame gets no plate rather than a plate in the wrong place.
     *
     * `streams[i]` is built from `request.cameras[i]`, so the two lists are read side by side.
     */
    private fun buildChrome(
        request: Request,
        streams: List<CameraStream>,
        cells: Map<Int, Cell>,
        renderer: GlRenderer,
    ): ChromeOverlay? {
        if (!request.chrome.label && !request.chrome.badge) return null
        if (cells.isEmpty()) return null
        if (renderer.surfaceWidth <= 0 || renderer.surfaceHeight <= 0) return null
        val marks = ArrayList<ChromeMark>(streams.size)
        streams.forEachIndexed { index, _ ->
            val camera = request.cameras.getOrNull(index) ?: return@forEachIndexed
            // A view that never painted gets no plate — but the five that did still get theirs.
            // This used to be `cells.size != streams.size → return null`, which threw away every
            // camera name and trigger outline in the whole file because one decoder stayed silent.
            val cell = cells[index] ?: return@forEachIndexed
            val fired = request.chrome.badge && camera.triggered
            val name = if (request.chrome.label) camera.label else ""
            val reason = if (fired && camera.trigger.isNotEmpty()) " · ${camera.trigger}" else ""
            marks += ChromeMark(
                left = (cell.left + 1f) / 2f,
                // NDC runs up, the page's fractions run down, and the plate is drawn into a bitmap
                // whose row 0 is its top line — so the same flip `Cell.of` makes on the way in.
                top = (1f - cell.top) / 2f,
                width = cell.width / 2f,
                height = cell.height / 2f,
                text = name + reason,
                fired = camera.triggered,
            )
        }
        return ChromeOverlay(renderer, renderer.surfaceWidth, renderer.surfaceHeight, marks,
            request.chrome).takeIf { it.build() }
    }

    private fun drainEncoder(
        encoder: MediaCodec,
        muxer: MediaMuxer,
        info: MediaCodec.BufferInfo,
        trackIndex: Int,
        endOfStream: Boolean,
    ): Int {
        var track = trackIndex
        var guard = 0
        while (guard++ < DRAIN_GUARD) {
            val index = encoder.dequeueOutputBuffer(info, 0)
            when {
                index >= 0 -> {
                    if (track < 0) track = addTrack(muxer, encoder, info)
                    if (track >= 0 && info.size > 0 &&
                        info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0
                    ) {
                        encoder.getOutputBuffer(index)?.let { buffer ->
                            buffer.position(info.offset)
                            buffer.limit(info.offset + info.size)
                            muxer.writeSampleData(track, buffer, info)
                        }
                    }
                    encoder.releaseOutputBuffer(index, false)
                    if (endOfStream && info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return track
                }
                index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    if (track >= 0) throw ExportException("encoder changed its output format mid-stream", code = "formatChanged")
                    track = addTrack(muxer, encoder, info)
                }
                else -> return track
            }
        }
        return track
    }

    /** The muxer only starts once it has the actual codec-private track format (SPS/PPS). */
    private fun addTrack(muxer: MediaMuxer, encoder: MediaCodec, info: MediaCodec.BufferInfo): Int {
        val track = muxer.addTrack(encoder.outputFormat)
        muxer.start()
        Log.i(TAG, "track $track added, ${info.size} bytes")
        return track
    }

    private fun videoFormat(request: Request, name: String): MediaFormat {
        val format = MediaFormat.createVideoFormat("video/avc", request.width, request.height)
        format.setInteger(
            MediaFormat.KEY_COLOR_FORMAT,
            MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface
        )
        format.setInteger(MediaFormat.KEY_BIT_RATE, request.bitrateBps)
        format.setInteger(MediaFormat.KEY_FRAME_RATE, request.fps)
        format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1)
        if (!name.startsWith("c2.android") && !name.startsWith("OMX.google")) {
            // Constant-rate hardware encoders visibly fall apart on dashcam motion, which is the one
            // thing this file has to survive, so take quality over a guaranteed bit rate.
            runCatching {
                format.setInteger(
                    MediaFormat.KEY_BITRATE_MODE,
                    MediaCodecInfo.EncoderCapabilities.BITRATE_MODE_VBR
                )
            }
        }
        return format
    }

    private fun encoderCandidates(request: Request): List<String> {
        val list = MediaCodecList(MediaCodecList.REGULAR_CODECS)
        val hardware = ArrayList<String>()
        val software = ArrayList<String>()
        for (info in list.codecInfos) {
            if (!info.isEncoder || !supports(info, "video/avc")) continue
            if (!sizeOk(info, "video/avc", request.width, request.height)) continue
            if (info.isSoftwareOnly) software += info.name else hardware += info.name
        }
        val ordered = if (request.preferHardware) hardware + software else software + hardware
        // An explicit name from the page goes first: it is how a known-bad vendor encoder gets
        // worked around without another build.
        return if (request.encoderName.isEmpty()) ordered else listOf(request.encoderName) + ordered.filter { it != request.encoderName }
    }

    private fun report(job: Job, phase: String, percent: Float, code: String,
                       message: String = "", args: Map<String, Any> = emptyMap()) {
        // R206: 单调钟。`currentTimeMillis()` 是墙上时钟，中途校时（用户改时间、运营商回灌、
        // 出国换时区都算）会把它往回拨，`now - lastReportAt` 一变负就永远小于 300 ms —— 进度条
        // 冻在拨钟那一刻的百分比，直到墙钟自己爬回去，而片子还在照常编码。
        val now = SystemClock.elapsedRealtime()
        if (now - job.lastReportAt < REPORT_MIN_INTERVAL_MS && percent < 1f) return
        job.lastReportAt = now
        val payload = JSONObject().apply {
            put("id", job.request.id)
            put("phase", phase)
            put("percent", Math.round(percent * 100).toInt())
            put("code", code)
            put("message", message)
            args.forEach { (key, value) -> put(key, value) }
        }
        job.listener.onProgress(payload.toString())
    }

    private fun errorPayload(id: Long, code: String, message: String = "",
                             args: Map<String, Any> = emptyMap()) = JSONObject().apply {
        put("id", id)
        put("phase", "error")
        put("percent", 0)
        put("code", code)
        put("message", message)
        args.forEach { (key, value) -> put(key, value) }
    }.toString()

    /** The size a `noFrames` toast has to quote: this is the pair the encoder was asked for. */
    private fun frameArgs(request: Request): Map<String, Any> =
        mapOf("w" to request.width, "h" to request.height)

    private fun lastEglError(): Int = EGL14.eglGetError()

    internal class Request(
        val id: Long,
        val outPath: String,
        val width: Int,
        val height: Int,
        val fps: Int,
        val durationUs: Long,
        val rows: Int,
        val cols: Int,
        val bitrateBps: Int,
        val preferHardware: Boolean,
        val encoderName: String,
        val decoderName: String,
        val cameras: List<CameraSpec>,
        val captions: List<CaptionSpec>,
        val wm: WmSpec,
        val chrome: ChromeSpec,
    ) {
        companion object {
            /** Six hours, because that is how long the service is allowed to run at all. */
            const val MAX_DURATION_US = 6L * 60L * 60L * 1_000_000L

            fun parse(json: String): Request {
                val root = JSONObject(json)
                val rows = root.optInt("rows", 1)
                val cols = root.optInt("cols", 1)
                val width = root.getInt("width").makeEven()
                val height = root.getInt("height").makeEven()
                val cameras = ArrayList<CameraSpec>()
                val list = root.optJSONArray("cameras") ?: JSONArray()
                for (i in 0 until list.length()) {
                    val item = list.getJSONObject(i)
                    val segments = ArrayList<SegmentSpec>()
                    val files = item.getJSONArray("segments")
                    for (s in 0 until files.length()) {
                        val segment = files.getJSONObject(s)
                        segments += SegmentSpec(
                            path = segment.getString("path"),
                            clipStartUs = segment.optLong("clipStartUs"),
                            clipEndUs = segment.optLong("clipEndUs", Long.MAX_VALUE / 4),
                            globalStartUs = segment.optLong("globalStartUs"),
                        )
                    }
                    if (segments.isEmpty()) continue
                    cameras += CameraSpec(item.getString("camera"), item.optInt("cell", i),
                        parseRect(item.optJSONArray("rect")),
                        parseBoxes(item.optJSONArray("mosaic")), segments,
                        label = item.optString("label"),
                        triggered = item.optBoolean("triggered"),
                        trigger = item.optString("trigger"))
                }
                if (cameras.isEmpty()) throw ExportException("no camera file matched the request", code = "noStreams")
                val captions = ArrayList<CaptionSpec>()
                val series = root.optJSONArray("captions") ?: JSONArray()
                for (c in 0 until series.length()) {
                    val entry = series.optJSONObject(c) ?: continue
                    captions += CaptionSpec(
                        us = entry.optLong("us"),
                        clk = entry.optString("clk"),
                        spd = entry.optString("spd"),
                        bar = if (entry.has("bar")) entry.getDouble("bar").toFloat() else -1f,
                        gps = entry.optString("gps"),
                        st = entry.optString("st"),
                        src = entry.optString("src"),
                    )
                }
                captions.sortBy { it.us }
                val wmRoot = root.optJSONObject("wm")
                val wm = if (wmRoot == null) WmSpec() else WmSpec(
                    place = wmRoot.optString("place", "tc"),
                    bg = wmRoot.optString("bg", "stroke"),
                    scale = wmRoot.optDouble("scale", 1.0).toFloat().coerceIn(0.5f, 2.5f),
                    unit = wmRoot.optString("unit", "km/h"),
                    topClear = wmRoot.optDouble("topClear", 0.0).toFloat().coerceIn(0f, 0.5f),
                )
                val fps = root.optInt("fps", 30).coerceIn(1, 60)
                val chromeRoot = root.optJSONObject("chrome")
                val chrome = if (chromeRoot == null) ChromeSpec() else ChromeSpec(
                    label = chromeRoot.optBoolean("label"),
                    badge = chromeRoot.optBoolean("badge"),
                )
                val cells = width.toLong() * height.toLong()
                val requestedBitrate = root.optInt("bitrateKbps", 0)
                val defaultBitrate = (cells * fps / 1000L * 0.09f).toInt().coerceIn(1_500, 24_000)
                // R143: the page used to hand over whatever range the handles happened to bracket.
                // A job longer than the service's own quota window cannot finish in one — Android stops
                // a dataSync service at 6 h, and `ExportService` releases its wake lock on the same
                // clock — so the request is refused here, where the number means something, rather
                // than dying halfway through and leaving a container nobody can play.
                val durationUs = root.optLong("durationUs", 0L).coerceAtLeast(1L)
                if (durationUs > MAX_DURATION_US) {
                    throw ExportException("a ${durationUs / 3_600_000_000L} h clip is past the limit",
                        code = "tooLong",
                        args = mapOf("hours" to (MAX_DURATION_US / 3_600_000_000L)))
                }
                return Request(
                    id = root.optLong("id", 1L),
                    outPath = root.getString("outPath"),
                    width = width,
                    height = height,
                    fps = fps,
                    durationUs = durationUs,
                    rows = rows.coerceAtLeast(1),
                    cols = cols.coerceAtLeast(1),
                    bitrateBps = (if (requestedBitrate > 0) requestedBitrate else defaultBitrate) * 1000,
                    preferHardware = root.optBoolean("preferHardware", true),
                    encoderName = root.optString("encoderName", ""),
                    decoderName = root.optString("decoderName", ""),
                    cameras = cameras,
                    captions = captions.sortedBy { it.us },
                    wm = wm,
                    chrome = chrome,
                )
            }

            private fun Int.makeEven() = if (this % 2 == 0) this else this - 1

            /**
             * `[x, y, w, h]` as the layout editor sends it. Anything else — a truncated array, a
             * NaN, a zero-width tile — falls back to the preset grid rather than drawing noise,
             * because the page can be a different build from the engine and the grid is always
             * something.
             */
            private fun parseRect(array: JSONArray?): List<Float>? {
                if (array == null || array.length() != 4) return null
                val values = (0 until 4).map { array.optDouble(it, Double.NaN).toFloat() }
                return values.takeIf {
                    it.all(Float::isFinite) && it[2] > 0f && it[3] > 0f
                }
            }

            /**
             * Privacy boxes, in the view's own picture coordinates. The shader has four slots, so a
             * fifth box is dropped rather than displacing one that is already on screen — the sheet
             * stops the user drawing more than the file can carry, and this is the same limit on the
             * other side of the bridge.
             */
            private fun parseBoxes(array: JSONArray?): List<List<Float>> {
                if (array == null) return emptyList()
                val boxes = ArrayList<List<Float>>()
                for (i in 0 until array.length()) {
                    val box = parseRect(array.optJSONArray(i)) ?: continue
                    if (box[2] < 0.01f || box[3] < 0.01f) continue
                    boxes += box
                    if (boxes.size == MAX_MOSAIC_BOXES) break
                }
                return boxes
            }
        }
    }

    private companion object {
        const val TAG = "TdExport"
        const val DRAIN_GUARD = 64
        const val TAIL_POLL_US = 100_000L
        const val TAIL_GRACE_MS = 20_000L
        const val EARLY_DEBUG_CALLS = 24
        const val PROGRESS_EVERY_FRAMES = 15L
        // How long the `auto` anchor waits for a view that has not painted yet, in frames.
        const val PAINT_LATCH_FRAMES = 2L
        const val REPORT_MIN_INTERVAL_MS = 300L
        const val MAX_MOSAIC_BOXES = 4
    }
}
