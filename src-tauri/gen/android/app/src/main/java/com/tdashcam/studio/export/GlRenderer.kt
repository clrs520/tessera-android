package com.tdashcam.studio.export

import android.opengl.EGL14
import android.opengl.EGLConfig
import android.opengl.EGLContext
import android.opengl.EGLDisplay
import android.opengl.EGLExt
import android.opengl.EGLSurface
import android.opengl.GLES11Ext
import android.opengl.GLES20
import android.util.Log
import android.view.Surface
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

/**
 * The one GL context the whole export runs in: every camera decoder renders into its own
 * `SurfaceTexture`, and each output frame composites those external textures into cells of the
 * encoder's input surface.
 *
 * Only two things here are specific to this app: the cell math (a source is *contained* in its
 * cell, never cropped, because cropping evidence is not acceptable) and `eglPresentationTimeANDROID`
 * before every swap, which is what puts our own clock onto the encoded frames instead of wall time.
 */
internal class GlRenderer(private val encoderSurface: Surface) {
    private var display: EGLDisplay = EGL14.EGL_NO_DISPLAY
    private var eglContext: EGLContext = EGL14.EGL_NO_CONTEXT
    private var eglSurface: EGLSurface = EGL14.EGL_NO_SURFACE
    private var config: EGLConfig? = null

    private var program = 0
    private var locPosition = -1
    private var locTexCoord = -1
    private var locTexMatrix = -1
    private var locTexture = -1
    private var locTexLinear = -1
    private var locMosaic = -1
    private var locBlock = -1

    private var overlayProgram = 0
    private var ovLocPosition = -1
    private var ovLocTexCoord = -1
    private var ovLocTexture = -1

    private val positions: FloatBuffer = directFloatBuffer(8)
    private val texCoords: FloatBuffer = directFloatBuffer(8)
    private val combinedMatrix = FloatArray(16)
    private val texLinear = FloatArray(4)

    var surfaceWidth = 0
        private set
    var surfaceHeight = 0
        private set

    /** Pixel ratio the NDC rect is measured against; `Cell.contain` needs it to stay honest. */
    val frameAspect: Float get() =
        if (surfaceWidth > 0 && surfaceHeight > 0) surfaceWidth.toFloat() / surfaceHeight.toFloat() else 1f

    fun init() {
        display = EGL14.eglGetDisplay(EGL14.EGL_DEFAULT_DISPLAY)
        if (display == EGL14.EGL_NO_DISPLAY) throw ExportException("no EGL display")
        val version = IntArray(2)
        if (!EGL14.eglInitialize(display, version, 0, version, 1)) throw ExportException("eglInitialize failed")

        // EGL_RECORDABLE_ANDROID is what lets the window surface feed a MediaCodec input surface;
        // without it the encoder surface may come out with a format the codec cannot consume.
        val attribs = intArrayOf(
            EGL14.EGL_RED_SIZE, 8,
            EGL14.EGL_GREEN_SIZE, 8,
            EGL14.EGL_BLUE_SIZE, 8,
            EGL14.EGL_ALPHA_SIZE, 8,
            EGL14.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
            EGLExt.EGL_RECORDABLE_ANDROID, 1,
            EGL14.EGL_NONE
        )
        val configs = arrayOfNulls<EGLConfig>(1)
        val counted = IntArray(1)
        if (!EGL14.eglChooseConfig(display, attribs, 0, configs, 0, 1, counted, 0) || counted[0] <= 0) {
            Log.w(TAG, "chooseConfig error ${EGL14.eglGetError()}")
            throw ExportException("no EGL config for ES2 + recordable")
        }
        config = configs[0] ?: throw ExportException("null EGL config")

        val contextAttribs = intArrayOf(
            EGL14.EGL_CONTEXT_CLIENT_VERSION, 2,
            EGL14.EGL_NONE
        )
        eglContext = EGL14.eglCreateContext(display, config, EGL14.EGL_NO_CONTEXT, contextAttribs, 0)
        if (eglContext == EGL14.EGL_NO_CONTEXT) throw ExportException("eglCreateContext failed: ${EGL14.eglGetError()}")

        eglSurface = EGL14.eglCreateWindowSurface(display, config, encoderSurface, intArrayOf(EGL14.EGL_NONE), 0)
        if (eglSurface == EGL14.EGL_NO_SURFACE) throw ExportException("eglCreateWindowSurface failed: ${EGL14.eglGetError()}")

        if (!EGL14.eglMakeCurrent(display, eglSurface, eglSurface, eglContext)) {
            throw ExportException("eglMakeCurrent failed: ${EGL14.eglGetError()}")
        }

        val size = IntArray(1)
        EGL14.eglQuerySurface(display, eglSurface, EGL14.EGL_WIDTH, size, 0)
        surfaceWidth = size[0]
        EGL14.eglQuerySurface(display, eglSurface, EGL14.EGL_HEIGHT, size, 0)
        surfaceHeight = size[0]

        program = buildProgram(VERTEX_SOURCE, FRAGMENT_SOURCE)
        // A program that is merely linked is not the *current* one: every uniform and draw below
        // would answer GL_INVALID_OPERATION and the whole composite would stay the colour of clear().
        GLES20.glUseProgram(program)
        locPosition = GLES20.glGetAttribLocation(program, "aPosition")
        locTexCoord = GLES20.glGetAttribLocation(program, "aTexCoord")
        locTexMatrix = GLES20.glGetUniformLocation(program, "uTexMatrix")
        locTexture = GLES20.glGetUniformLocation(program, "uTexture")
        locTexLinear = GLES20.glGetUniformLocation(program, "uTexLinear")
        // The location of element 0 of a uniform array addresses the whole array for `glUniform4fv`,
        // so one call carries every box of this cell.
        locMosaic = GLES20.glGetUniformLocation(program, "uMosaic[0]")
        locBlock = GLES20.glGetUniformLocation(program, "uBlock")
        overlayProgram = buildProgram(OVERLAY_VERTEX_SOURCE, OVERLAY_FRAGMENT_SOURCE)
        ovLocPosition = GLES20.glGetAttribLocation(overlayProgram, "aPosition")
        ovLocTexCoord = GLES20.glGetAttribLocation(overlayProgram, "aTexCoord")
        ovLocTexture = GLES20.glGetUniformLocation(overlayProgram, "uTexture")
        GLES20.glUseProgram(program)
        Log.i(TAG, "program $program loc pos=$locPosition tex=$locTexCoord matrix=$locTexMatrix sampler=$locTexture; " +
            "gl=${GLES20.glGetString(GLES20.GL_VERSION)} renderer=${GLES20.glGetString(GLES20.GL_RENDERER)} " +
            "surface=${surfaceWidth}x$surfaceHeight")
        checkGl("init")
    }

    /**
     * A GL error is sticky and tells you nothing about which call made it, so the first frames get
     * checked at every step; after that the per-call round trips are not worth the cost.
     */
    var debugCalls = 0

    private fun step(where: String) {
        if (debugCalls > 0) {
            debugCalls--
            checkGl(where)
        }
    }

    fun release() {
        if (display != EGL14.EGL_NO_DISPLAY) {
            // Deleted while the context is still current: glDeleteProgram on a thread with no
            // context is a silent no-op that leaks the shader on some drivers and logs
            // "call to OpenGL ES API with no current context" on others.
            if (program != 0) {
                GLES20.glDeleteProgram(program)
                program = 0
            }
            if (overlayProgram != 0) {
                GLES20.glDeleteProgram(overlayProgram)
                overlayProgram = 0
            }
            EGL14.eglMakeCurrent(display, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_SURFACE, EGL14.EGL_NO_CONTEXT)
            if (eglSurface != EGL14.EGL_NO_SURFACE) {
                EGL14.eglDestroySurface(display, eglSurface)
                eglSurface = EGL14.EGL_NO_SURFACE
            }
            if (eglContext != EGL14.EGL_NO_CONTEXT) {
                EGL14.eglDestroyContext(display, eglContext)
                eglContext = EGL14.EGL_NO_CONTEXT
            }
            EGL14.eglTerminate(display)
        }
        display = EGL14.EGL_NO_DISPLAY
    }

    /**
     * A decoder writes the coded frame into the SurfaceTexture, so its own transform matrix carries
     * the flip, the crop *and* the container's rotation: `CCodecBufferChannel` (and `ACodec`'s
     * `setNativeWindowRotation`) turn the buffer's transform flag per frame from the same
     * rotation metadata `MediaMetadataRetriever` uses, and `getTransformMatrix` hands that back.
     *
     * Sampling with it as-is is therefore the whole job. A second turn folded in here — which an
     * earlier revision did, on the reading that rotation is a display property the decoder path
     * bypasses — walked the frame one quarter past its display orientation; measured on API 36
     * against one bitstream declared at 90, 180 and 270, the extra turn made the exported pixels
     * come back as the un-rotated coded picture in all three cases.
     */
    fun drawTexture(textureId: Int, transform: FloatArray, left: Float, bottom: Float,
                    right: Float, top: Float, mosaic: FloatArray = NO_MOSAIC) {
        System.arraycopy(transform, 0, combinedMatrix, 0, 16)

        // The mosaic boxes are quad coordinates — fractions of *this view's displayed picture* — so
        // they need no rotation math: whatever `combinedMatrix` then does to a point, it does to the
        // snapped point too. The step is measured against the pixels this cell actually paints, so
        // the blocks come out square in the file rather than square in the source.
        texLinear[0] = combinedMatrix[0]; texLinear[1] = combinedMatrix[1]
        texLinear[2] = combinedMatrix[4]; texLinear[3] = combinedMatrix[5]
        val paintedWidth = (right - left) * 0.5f * surfaceWidth
        val paintedHeight = (top - bottom) * 0.5f * surfaceHeight
        val block = if (paintedHeight > 0f) (paintedHeight / MOSAIC_BLOCK_DIVISOR).coerceAtLeast(2f) else 1f
        GLES20.glUniform2f(locBlock,
            if (paintedWidth > 0f) block / paintedWidth else 1f,
            if (paintedHeight > 0f) block / paintedHeight else 1f)
        // Count is the whole array: `glUniform4fv(…, 1, …)` uploads only the first vec4, which
        // silently drops every box after the first one.
        GLES20.glUniform4fv(locMosaic, mosaic.size / 4, mosaic, 0)
        GLES20.glUniformMatrix2fv(locTexLinear, 1, false, texLinear, 0)

        positions.position(0)
        positions.put(left).put(bottom).put(right).put(bottom)
        positions.put(left).put(top).put(right).put(top)
        positions.position(0)

        texCoords.position(0)
        texCoords.put(0f).put(0f).put(1f).put(0f).put(0f).put(1f).put(1f).put(1f)
        texCoords.position(0)

        GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, textureId)
        step("bind $textureId")
        GLES20.glUniform1i(locTexture, 0)
        GLES20.glUniformMatrix4fv(locTexMatrix, 1, false, combinedMatrix, 0)
        step("uniform $textureId")

        GLES20.glVertexAttribPointer(locPosition, 2, GLES20.GL_FLOAT, false, 0, positions)
        GLES20.glEnableVertexAttribArray(locPosition)
        GLES20.glVertexAttribPointer(locTexCoord, 2, GLES20.GL_FLOAT, false, 0, texCoords)
        GLES20.glEnableVertexAttribArray(locTexCoord)
        step("attrib $textureId")

        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
        checkGl("draw $textureId")
    }

    fun clear() {
        GLES20.glViewport(0, 0, surfaceWidth, surfaceHeight)
        GLES20.glClearColor(0f, 0f, 0f, 1f)
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
    }

    /** The encoder takes its frame timestamps from here, not from the clock. */
    fun setPresentationTime(timeUs: Long) {
        if (!EGLExt.eglPresentationTimeANDROID(display, eglSurface, timeUs * 1000L)) {
            throw ExportException("eglPresentationTimeANDROID failed: ${EGL14.eglGetError()}")
        }
    }

    fun swap(): Boolean = EGL14.eglSwapBuffers(display, eglSurface)

    fun newExternalTexture(): Int {
        val ids = IntArray(1)
        GLES20.glGenTextures(1, ids, 0)
        bindExternalTexture(ids[0])
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
        GLES20.glTexParameteri(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
        checkGl("genTexture")
        return ids[0]
    }

    /**
     * `SurfaceTexture.updateTexImage` consumes into whatever texture this thread has bound to the
     * external target, so whoever takes a frame has to bind first. It is also the binding the
     * sampler needs at draw time, so the two uses agree on one texture id.
     */
    fun bindExternalTexture(id: Int) {
        GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, id)
    }

    fun deleteTexture(id: Int) {
        GLES20.glDeleteTextures(1, intArrayOf(id), 0)
    }

    // ---- burned-in overlay (captions) -------------------------------------------------------------

    /**
     * An ordinary RGBA texture the size of the caption strip. Separate from the camera textures
     * because `GL_TEXTURE_EXTERNAL_OES` cannot be written by CPU, only by a decoder.
     */
    fun newRgbaTexture(width: Int, height: Int): Int {
        val ids = IntArray(1)
        GLES20.glGenTextures(1, ids, 0)
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, ids[0])
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE)
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE)
        GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_RGBA, width, height, 0,
            GLES20.GL_RGBA, GLES20.GL_UNSIGNED_BYTE, null)
        checkGl("genRgbaTexture")
        return ids[0]
    }

    /** Reallocates when the strip grows a line; a new line means new text, which is rare. */
    fun uploadRgba(textureId: Int, bitmap: android.graphics.Bitmap) {
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId)
        if (bitmap.width != textureWidth || bitmap.height != textureHeight) {
            GLES20.glTexImage2D(GLES20.GL_TEXTURE_2D, 0, GLES20.GL_RGBA, bitmap.width, bitmap.height, 0,
                GLES20.GL_RGBA, GLES20.GL_UNSIGNED_BYTE, null)
            textureWidth = bitmap.width
            textureHeight = bitmap.height
        }
        android.opengl.GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0)
        checkGl("uploadRgba")
    }

    private var textureWidth = 0
    private var textureHeight = 0

    /**
     * Bind an RGBA texture that was already allocated at its final size. The chrome plate is built
     * once for the whole job, so it must not disturb the pair above — those track the *caption*
     * strip's reallocation, and a second overlay sharing them would make the strip re-allocate on
     * every line change.
     */
    fun bindRgba(textureId: Int) {
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId)
    }

    /**
     * Alpha-blend the strip over whatever is already in the frame. The cell program stays current
     * afterwards because `drawTexture` never calls `glUseProgram` — it is bound once in `init`, so
     * this has to hand it back rather than leave the composite drawing with the overlay's program.
     */
    fun drawOverlay(textureId: Int, left: Float, bottom: Float, right: Float, top: Float) {
        GLES20.glUseProgram(overlayProgram)
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)

        positions.position(0)
        positions.put(left).put(bottom).put(right).put(bottom)
        positions.put(left).put(top).put(right).put(top)
        positions.position(0)

        // Row 0 of a bitmap is its top line, and NDC y runs up, so the strip's texture coordinates
        // go against the quad it lands on.
        texCoords.position(0)
        texCoords.put(0f).put(1f).put(1f).put(1f).put(0f).put(0f).put(1f).put(0f)
        texCoords.position(0)

        GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId)
        GLES20.glUniform1i(ovLocTexture, 0)
        GLES20.glVertexAttribPointer(ovLocPosition, 2, GLES20.GL_FLOAT, false, 0, positions)
        GLES20.glEnableVertexAttribArray(ovLocPosition)
        GLES20.glVertexAttribPointer(ovLocTexCoord, 2, GLES20.GL_FLOAT, false, 0, texCoords)
        GLES20.glEnableVertexAttribArray(ovLocTexCoord)
        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
        GLES20.glDisable(GLES20.GL_BLEND)
        checkGl("drawOverlay")
        GLES20.glUseProgram(program)
    }

    private fun buildProgram(vertexSource: String, fragmentSource: String): Int {
        val vertex = compile(GLES20.GL_VERTEX_SHADER, vertexSource)
        val fragment = compile(GLES20.GL_FRAGMENT_SHADER, fragmentSource)
        val linked = GLES20.glCreateProgram()
        GLES20.glAttachShader(linked, vertex)
        GLES20.glAttachShader(linked, fragment)
        GLES20.glLinkProgram(linked)
        val status = IntArray(1)
        GLES20.glGetProgramiv(linked, GLES20.GL_LINK_STATUS, status, 0)
        if (status[0] == 0) {
            val log = GLES20.glGetProgramInfoLog(linked)
            GLES20.glDeleteProgram(linked)
            throw ExportException("link failed: $log")
        }
        return linked
    }

    private fun compile(type: Int, source: String): Int {
        val shader = GLES20.glCreateShader(type)
        GLES20.glShaderSource(shader, source)
        GLES20.glCompileShader(shader)
        val status = IntArray(1)
        GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, status, 0)
        if (status[0] == 0) {
            val log = GLES20.glGetShaderInfoLog(shader)
            GLES20.glDeleteShader(shader)
            throw ExportException("shader compile failed: $log")
        }
        return shader
    }

    private fun checkGl(where: String) {
        var error = GLES20.glGetError()
        while (error != GLES20.GL_NO_ERROR) {
            Log.w(TAG, "GL error $error at $where")
            error = GLES20.glGetError()
        }
    }

    private fun directFloatBuffer(floats: Int): FloatBuffer {
        val buffer = ByteBuffer.allocateDirect(floats * 4).order(ByteOrder.nativeOrder())
        return buffer.asFloatBuffer()
    }

    private companion object {
        const val TAG = "TdExportGl"

        /** A cell with no boxes: `w <= 0` fails the shader's inside test for every slot. */
        val NO_MOSAIC = FloatArray(16)

        /** Mosaic blocks land at about this many of them across the painted height of a view. */
        const val MOSAIC_BLOCK_DIVISOR = 20f

        const val VERTEX_SOURCE = """
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            uniform mat4 uTexMatrix;
            varying vec2 vTexCoord;
            varying vec2 vQuadCoord;
            void main() {
                gl_Position = aPosition;
                vQuadCoord = aTexCoord;
                vTexCoord = (uTexMatrix * vec4(aTexCoord, 0.0, 1.0)).xy;
            }
        """

        /**
         * The mosaic is applied to the quad coordinate and the texture matrix then carries the
         * result, which costs one matrix-vector product per fragment instead of a second varying.
         * The base coordinate stays exactly what the vertex shader interpolated — the shader adds
         * only the *difference* the snap made — so a cell with no boxes samples the identical texel
         * it did before this feature existed, at the driver's own precision rather than a mediump
         * reconstruction of the full transform.
         */
        const val FRAGMENT_SOURCE = """
            #extension GL_OES_EGL_image_external : require
            precision mediump float;
            varying vec2 vTexCoord;
            varying vec2 vQuadCoord;
            uniform samplerExternalOES uTexture;
            uniform mat2 uTexLinear;
            uniform vec4 uMosaic[4];
            uniform vec2 uBlock;

            vec2 snap(vec2 q, vec4 box) {
                vec2 local = q - box.xy;
                bool inside = box.z > 0.0 && box.w > 0.0 &&
                    local.x >= 0.0 && local.y >= 0.0 && local.x < box.z && local.y < box.w;
                if (!inside) return q;
                return box.xy + (floor(local / uBlock) + 0.5) * uBlock;
            }

            void main() {
                vec2 q = snap(vQuadCoord, uMosaic[0]);
                q = snap(q, uMosaic[1]);
                q = snap(q, uMosaic[2]);
                q = snap(q, uMosaic[3]);
                gl_FragColor = texture2D(uTexture, vTexCoord + uTexLinear * (q - vQuadCoord));
            }
        """

        const val OVERLAY_VERTEX_SOURCE = """
            attribute vec4 aPosition;
            attribute vec2 aTexCoord;
            varying vec2 vTexCoord;
            void main() {
                gl_Position = aPosition;
                vTexCoord = aTexCoord;
            }
        """

        const val OVERLAY_FRAGMENT_SOURCE = """
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D uTexture;
            void main() {
                gl_FragColor = texture2D(uTexture, vTexCoord);
            }
        """
    }
}

/**
 * Where one camera lands in the output frame. Everything is in GL space (-1..1, y up), and the
 * rect is already the *contained* one: the source keeps its aspect ratio and the leftover stays
 * black, which is the same rule the on-screen grid follows.
 */
internal data class Cell(val left: Float, val bottom: Float, val right: Float, val top: Float) {
    val width: Float get() = right - left
    val height: Float get() = top - bottom

    companion object {
        fun grid(rows: Int, cols: Int, index: Int): Cell {
            val row = index / cols
            val col = index % cols
            val cellWidth = 2f / cols
            val cellHeight = 2f / rows
            val left = -1f + col * cellWidth
            val bottom = 1f - (row + 1) * cellHeight
            return Cell(left, bottom, left + cellWidth, bottom + cellHeight)
        }

        /**
         * A rect the page placed by hand: `[x, y, w, h]` in fractions of the frame, `y` counting
         * **down from the top** because that is how the sheet's own coordinates read. NDC is y-up,
         * so the flip happens here rather than in the page, and a layout that looks right in the
         * preview is then guaranteed to come out the right way up.
         */
        fun of(rect: List<Float>): Cell {
            val x = rect[0].coerceIn(0f, 1f)
            val y = rect[1].coerceIn(0f, 1f)
            val w = rect[2].coerceIn(0.02f, 1f - x)
            val h = rect[3].coerceIn(0.02f, 1f - y)
            val left = -1f + 2f * x
            val top = 1f - 2f * y
            return Cell(left, top - 2f * h, left + 2f * w, top)
        }

        /**
         * Fit a `sourceWidth x sourceHeight` frame inside `cell` without cropping.
         *
         * `frameAspect` is the pixel ratio of the *whole output frame*, and it cannot be left
         * out: both cell axes are 2 units across no matter how many pixels those units are, so a
         * rect derived from `sourceAspect` alone has the right shape only when the frame is
         * square. Real 1.5437 footage in a 1104x720 frame came out 1104x466 without it — the
         * 「压扁」 this file is not allowed to have.
         */
        fun contain(cell: Cell, sourceWidth: Int, sourceHeight: Int, frameAspect: Float): Cell {
            if (sourceWidth <= 0 || sourceHeight <= 0) return cell
            val sourceAspect = sourceWidth.toFloat() / sourceHeight.toFloat()
            val cellAspect = cell.width / cell.height * frameAspect
            if (sourceAspect <= cellAspect) {
                val fittedWidth = cell.height * sourceAspect / frameAspect
                val inset = (cell.width - fittedWidth) / 2f
                return Cell(cell.left + inset, cell.bottom, cell.right - inset, cell.top)
            }
            val fittedHeight = cell.width * frameAspect / sourceAspect
            val inset = (cell.height - fittedHeight) / 2f
            return Cell(cell.left, cell.bottom + inset, cell.right, cell.top - inset)
        }
    }
}

/**
 * R143: `code` is what the page puts words against. The engine has no dictionary, so its own sentence
 * is only ever the fallback and the log line — a Chinese string here used to land verbatim in an
 * English toast.
 */
class ExportException(message: String, val code: String = "",
                      val args: Map<String, Any> = emptyMap()) : Exception(message)
