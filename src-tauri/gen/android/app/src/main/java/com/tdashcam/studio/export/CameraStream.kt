package com.tdashcam.studio.export

import android.graphics.SurfaceTexture
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaCodecList
import android.media.MediaExtractor
import android.media.MediaFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Surface
import java.io.File
import java.util.Locale
import java.util.concurrent.atomic.AtomicLong

/**
 * One camera's slice of the output timeline: a list of source files, each with the range to take
 * from it and where that range sits on the global clock, decoded into a single `SurfaceTexture`
 * that the compositor samples.
 *
 * Three things make this more than a loop over `MediaCodec`:
 * - The files are one-minute segments, so crossing a minute means swapping the extractor and
 *   reconfiguring the decoder mid-stream while the output clock keeps running.
 * - Sample timestamps in these MP4s do not start at zero, so every time comparison goes through
 *   `firstSamplePtsUs` — the pts of the first sample in the file, read before any seek.
 * - The decoder renders into a surface rather than yielding byte buffers, so "give me the frame at
 *   t" is answered by *how much we feed*, not by reading a timestamp back: frames fed at or before
 *   t are posted, and the surface keeps the newest one.
 */
internal class CameraStream(
    val camera: String,
    val cellIndex: Int,
    val rect: List<Float>?,
    val mosaic: List<List<Float>>,
    val segments: List<SegmentSpec>,
    private val gl: GlRenderer,
    private val preferredDecoder: String,
    private val preferHardware: Boolean,
) {
    val textureId: Int = gl.newExternalTexture()
    private val surfaceTexture = SurfaceTexture(textureId)
    private val surface = Surface(surfaceTexture)
    private val transformMatrix = FloatArray(16)
    private val bufferInfo = MediaCodec.BufferInfo()
    private val postedCount = AtomicLong(0)
    private var consumed = 0L

    private var extractor: MediaExtractor? = null
    private var codec: MediaCodec? = null
    private var openedIndex = -1
    private var firstSamplePtsUs = 0L
    private var inputEnded = false
    private var reachedEndOfStream = false
    private var loggedFrame = false

    /**
     * The frame size as the container declares it, which is the size that should be *shown*: an
     * 858-wide stream is coded 864 but declared 858, and a cell sized from the coded number
     * inherits the macroblock padding as a stretch. The SurfaceTexture transform is not a second
     * source for this — it is expressed against the decoder's own buffer (a 1080 stream lands in a
     * 1152-wide one), so its axis lengths are the crop's fraction of *that*, and multiplying them
     * in here shrinks the picture by the padding instead of describing it.
     */
    var sourceWidth = 0
        private set
    var sourceHeight = 0
        private set
    /**
     * Sizes the cell (see [displayWidth]); the turn itself is not applied from here, because the
     * decoder writes it into the buffer's transform flag and [transform] already carries it.
     */
    var rotationDegrees = 0
        private set
    var codecName = ""
        private set

    /** False until the very first frame has actually been posted; the cell stays black before it. */
    var hasFrame = false

        private set

    /** 解码器是否已经投过至少一帧。`hasFrame` 要等纹理真正上传才变真，预热看的是这个。 */
    fun hasPostedFrame(): Boolean = postedCount.get() > 0

    val displayWidth: Int get() = if (rotationDegrees % 180 == 0) sourceWidth else sourceHeight
    val displayHeight: Int get() = if (rotationDegrees % 180 == 0) sourceHeight else sourceWidth

    init {
        surfaceTexture.setOnFrameAvailableListener({ postedCount.incrementAndGet() }, Handler(Looper.getMainLooper()))
    }

    /**
     * The privacy boxes as four `vec4` uniforms in the order the shader reads them.
     *
     * The page measures `y` **down from the top** of the view's picture, the same way a DOM box and
     * the editor's own overlay are specified, while the shader's quad coordinate runs from its
     * bottom-left corner — so only that one axis turns here. Everything else the box needs is
     * already in the right space: the cell the view is drawn into is *contained*, which makes the
     * quad exactly the displayed picture, so a box drawn on the preview covers the pixels it covers
     * in the file no matter where the view ends up in the frame.
     */
    val mosaicUniforms: FloatArray = FloatArray(16).also { out ->
        mosaic.take(4).forEachIndexed { index, box ->
            if (box.size != 4) return@forEachIndexed
            val x = box[0].coerceIn(0f, 1f)
            val y = box[1].coerceIn(0f, 1f)
            val width = box[2].coerceIn(0f, 1f - x)
            val height = box[3].coerceIn(0f, 1f - y)
            out[index * 4] = x
            out[index * 4 + 1] = 1f - y - height
            out[index * 4 + 2] = width
            out[index * 4 + 3] = height
        }
    }

    /** Output time range this segment occupies on the global clock. */
    private fun segmentEndUs(segment: SegmentSpec) =
        segment.globalStartUs + (segment.clipEndUs - segment.clipStartUs)

    private fun indexFor(globalUs: Long): Int {
        segments.forEachIndexed { index, segment ->
            if (globalUs < segmentEndUs(segment)) {
                return if (globalUs >= segment.globalStartUs) index else -1
            }
        }
        return -1
    }

    /**
     * Move to the segment that covers `globalUs`. A gap between segments (a minute that was not
     * copied to the phone) returns -1 rather than silently showing the next file early.
     */
    fun advanceTo(globalUs: Long): Boolean {
        val index = indexFor(globalUs)
        if (index < 0) return false
        if (index != openedIndex) openSegment(index)
        val segment = segments[index]
        val sourceUs = segment.clipStartUs + (globalUs - segment.globalStartUs)
        feed(sourceUs)
        drainRendered()
        return true
    }

    /**
     * Take the newest posted frame; returns whether anything can be drawn at all.
     *
     * `updateTexImage` uploads into whatever texture is bound to `GL_TEXTURE_EXTERNAL_OES` on the
     * calling thread, so the bind belongs here rather than in setup: skipping it leaves the texture
     * empty and the whole composite comes out black.
     */
    fun updateTexImage(): Boolean {
        val posted = postedCount.get()
        if (posted > consumed) {
            consumed = posted
            gl.bindExternalTexture(textureId)
            try {
                surfaceTexture.updateTexImage()
                hasFrame = true
            } catch (e: IllegalStateException) {
                Log.w(TAG, "$camera updateTexImage: ${e.message}")
            }
        }
        if (!hasFrame) return false
        surfaceTexture.getTransformMatrix(transformMatrix)
        if (!loggedFrame) {
            loggedFrame = true
            // The matrix's axis lengths are the crop's fraction of the decoder's own buffer, so a
            // padded stream shows e.g. 0.9358 here while its picture is still the track size above.
            Log.i(TAG, "$camera first frame size=${sourceWidth}x${sourceHeight} rot=$rotationDegrees " +
                "tx=${transformMatrix.joinToString(",") { "%f".format(Locale.US, it) }}")
        }
        return true
    }

    fun transform(): FloatArray = transformMatrix

    fun close() {
        runCatching { codec?.stop() }
        runCatching { codec?.release() }
        codec = null
        runCatching { extractor?.release() }
        extractor = null
        runCatching { surface.release() }
        runCatching { surfaceTexture.release() }
    }

    private fun openSegment(index: Int) {
        val segment = segments[index]
        val previous = extractor
        runCatching { previous?.release() }

        val next = MediaExtractor()
        // Owned from here, not from the successful-open line below: `setDataSource` and
        // `selectVideoTrack` both throw, and an extractor holds a file descriptor that `close()`
        // cannot release if the field never pointed at it.
        extractor = next
        try {
            next.setDataSource(segment.path)
        } catch (e: Exception) {
            // A file that is simply not there (scanned before someone deleted it, or the card was
            // pulled) answered with the same English extractor sentence as a damaged one, and the
            // page had no code to put words against — the toast said 「意外错误」 for the most
            // ordinary cause there is.
            val missing = !File(segment.path).isFile
            throw ExportException(
                "$camera: cannot open ${segment.path}: ${e.message}",
                code = if (missing) "missingSource" else "badSource",
                args = mapOf("camera" to camera),
            )
        }
        val track = selectVideoTrack(next)
        next.selectTrack(track)
        // A clip range is expressed *relative to the file*, because that is what the page knows and
        // what `feed` compares against. `seekTo` speaks the file's own pts, which does not always
        // start at zero, so the base is added here rather than leaking out to the callers.
        firstSamplePtsUs = next.getSampleTime().coerceAtLeast(0L)
        if (segment.clipStartUs > 0) {
            next.seekTo(firstSamplePtsUs + segment.clipStartUs, MediaExtractor.SEEK_TO_PREVIOUS_SYNC)
        }

        val trackFormat = next.getTrackFormat(track)
        sourceWidth = trackFormat.intOr(MediaFormat.KEY_WIDTH, 0)
        sourceHeight = trackFormat.intOr(MediaFormat.KEY_HEIGHT, 0)
        rotationDegrees = trackFormat.intOr(KEY_ROTATION, 0)
        surfaceTexture.setDefaultBufferSize(sourceWidth, sourceHeight)

        val mime = trackFormat.getString(MediaFormat.KEY_MIME) ?: ""
        var instance: MediaCodec? = null
        var name = ""
        val rejected = StringBuilder()
        for (candidate in decoderCandidates(mime)) {
            codec?.let { runCatching { it.stop() }; runCatching { it.release() } }
            // A new instance per segment: the minute boundary is a fresh elementary stream, and
            // reconfiguring the same one is only documented for flush(), not for a new track format.
            val created = try {
                MediaCodec.createByCodecName(candidate)
            } catch (e: Exception) {
                rejected.append("$candidate: ${e.message}; ")
                continue
            }
            try {
                created.configure(trackFormat, surface, null, 0)
                created.start()
            } catch (e: Exception) {
                runCatching { created.release() }
                rejected.append("$candidate: ${e.message}; ")
                continue
            }
            instance = created
            name = candidate
            break
        }
        if (instance == null) {
            throw ExportException("$camera: no decoder for ${segment.path}: $rejected", code = "noDecoder")
        }
        codec = instance
        codecName = name
        openedIndex = index
        inputEnded = false
        reachedEndOfStream = false
    }

    private fun selectVideoTrack(ex: MediaExtractor): Int {
        for (i in 0 until ex.trackCount) {
            val mime = ex.getTrackFormat(i).getString(MediaFormat.KEY_MIME) ?: continue
            if (mime.startsWith("video/")) return i
        }
        throw ExportException("$camera: no video track", code = "badSource", args = mapOf("camera" to camera))
    }

    /**
     * Feed everything due by `sourceUs`. Samples are only handed over once their time is known,
     * and the extractor is not advanced for one that is not due yet, so no frame is ever skipped.
     */
    private fun feed(sourceUs: Long) {
        val ex = extractor ?: return
        val decoder = codec ?: return
        if (inputEnded) return
        val segment = segments[openedIndex]
        var guard = 0
        while (guard++ < MAX_FEED_PER_ADVANCE && !inputEnded) {
            val pts = ex.getSampleTime()
            if (pts < 0) {
                queueEndOfStream(decoder, 0L)
                break
            }
            val source = pts - firstSamplePtsUs
            if (source > segment.clipEndUs) {
                queueEndOfStream(decoder, source)
                break
            }
            if (source > sourceUs) return
            val inputIndex = decoder.dequeueInputBuffer(INPUT_TIMEOUT_US)
            if (inputIndex < 0) return
            val inputBuffer = decoder.getInputBuffer(inputIndex) ?: return
            val size = ex.readSampleData(inputBuffer, 0)
            if (size < 0) {
                queueEndOfStream(decoder, source)
                break
            }
            val flags = if ((ex.sampleFlags and 0x40) != 0)
                MediaCodec.BUFFER_FLAG_CODEC_CONFIG else 0
            decoder.queueInputBuffer(inputIndex, 0, size, source, flags)
            ex.advance()
        }
    }

    private fun queueEndOfStream(decoder: MediaCodec, sourceUs: Long) {
        val index = decoder.dequeueInputBuffer(INPUT_TIMEOUT_US)
        if (index < 0) return
        decoder.queueInputBuffer(index, 0, 0, sourceUs, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
        inputEnded = true
    }

    private fun drainRendered() {
        val decoder = codec ?: return
        var guard = 0
        while (guard++ < MAX_DRAIN_PER_ADVANCE) {
            val index = decoder.dequeueOutputBuffer(bufferInfo, OUTPUT_TIMEOUT_US)
            when {
                index >= 0 -> {
                    val renderable = bufferInfo.size > 0 &&
                        bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG == 0
                    decoder.releaseOutputBuffer(index, renderable)
                    if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) reachedEndOfStream = true
                }
                index == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                    // Only the rotation is taken from here. The output format names the *padded*
                    // frame (an 858-wide stream is reported 864), and a cell sized from that turns
                    // the padding into a stretch; the container's display size above is the picture,
                    // and the SurfaceTexture transform maps the cell onto it.
                    rotationDegrees = decoder.outputFormat.intOr(KEY_ROTATION, rotationDegrees)
                }
                else -> return
            }
        }
    }

    private fun MediaFormat.intOr(key: String, fallback: Int): Int =
        try {
            getInteger(key)
        } catch (e: Exception) {
            fallback
        }

    /**
     * Hardware decoders first when asked for it: six 1280x720 streams is beyond what the platform
     * software codecs sustain on a phone, but a device with no AVC hardware decoder still has to get
     * an answer, so the software list is the fallback rather than an error. Every candidate gets a
     * real instantiation attempt in `openSegment`, because being in the codec list does not mean the
     * service behind it answers.
     */
    private fun decoderCandidates(mime: String): List<String> {
        if (mime.isEmpty()) throw ExportException("$camera: no mime type")
        val list = MediaCodecList(MediaCodecList.REGULAR_CODECS)
        val hardware = ArrayList<String>()
        val software = ArrayList<String>()
        for (info in list.codecInfos) {
            if (info.isEncoder) continue
            if (runCatching { info.getCapabilitiesForType(mime) }.getOrNull() == null) continue
            if (info.isSoftwareOnly) {
                if (!software.contains(info.name)) software += info.name
            } else if (!hardware.contains(info.name)) {
                hardware += info.name
            }
        }
        val ordered = if (preferHardware) hardware + software else software + hardware
        val candidates = if (preferredDecoder.isEmpty()) ordered
        else listOf(preferredDecoder) + ordered.filter { it != preferredDecoder }
        // createByCodecName also takes a MIME type, which is the last resort before giving up.
        return candidates.ifEmpty { listOf(mime) }
    }

    private companion object {
        const val TAG = "TdExportCam"
        const val INPUT_TIMEOUT_US = 2000L
        const val OUTPUT_TIMEOUT_US = 2000L
        const val MAX_FEED_PER_ADVANCE = 400
        const val MAX_DRAIN_PER_ADVANCE = 400
        val KEY_ROTATION = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
            MediaFormat.KEY_ROTATION else "rotation-degrees"
    }
}
