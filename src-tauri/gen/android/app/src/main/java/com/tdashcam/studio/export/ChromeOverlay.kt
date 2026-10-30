package com.tdashcam.studio.export

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.opengl.GLUtils
import android.util.Log

/**
 * The two marks that are not the watermark: which view this is, and which views were watching when
 * the event fired.
 *
 * They are **one static bitmap for the whole job**, drawn over the frame every frame. A name and a
 * trigger outline cannot change while the clip plays, so unlike [CaptionOverlay] there is nothing to
 * rebuild per second — one upload, then a blended quad.
 *
 * Both sit on the view's *picture* rather than its cell: the letterbox around a contained feed is
 * black in the file, and a name floating in the black would be a mark that says nothing about the
 * footage. `pePaintPreviewChrome` in `script.js` mirrors the arithmetic below so 「预览」 is the file;
 * change one and change the other.
 *
 * The style is the player's own, not the desktop filter's: `.camera-label` (white on a 60% plate,
 * bold) and `.video-container.trigger-cam .camera-label` (amber plate, dark text) plus the 2px
 * `#ff9f0a` `.trigger-frame`. That is what the user has been looking at while choosing the range, so
 * it is what the file has to answer with. The desktop's plain `drawtext` ratio is kept only for the
 * size: 18px on the tile it scales every feed into, which is 1/30th of the tile's height.
 */
internal class ChromeOverlay(
    private val gl: GlRenderer,
    private val frameWidth: Int,
    private val frameHeight: Int,
    private val marks: List<ChromeMark>,
    private val spec: ChromeSpec,
) {
    /**
     * A 4K frame does not need a 4K plate to draw a 24px name on. Capped well above what any layout
     * asks for, so the bitmap is never what limits legibility — the encoder's own pixels are.
     */
    private val scale = if (frameWidth > 0) minOf(1f, MAX_WIDTH.toFloat() / frameWidth) else 1f
    private val canvasWidth = (frameWidth * scale).toInt().coerceAtLeast(16)
    private val canvasHeight = (frameHeight * scale).toInt().coerceAtLeast(16)

    private val platePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
    }
    private val framePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        color = AMBER
    }
    private val rect = RectF()

    private var textureId = 0
    private var bitmap: Bitmap? = null

    /** Whether there is anything at all to draw — two switches off means no texture, no blend. */
    val isEmpty: Boolean get() = !spec.label && !spec.badge

    fun build(): Boolean {
        if (isEmpty) return false
        val next = Bitmap.createBitmap(canvasWidth, canvasHeight, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(next)
        marks.forEach { paintMark(canvas, it) }
        bitmap?.recycle()
        bitmap = next
        if (textureId == 0) textureId = gl.newRgbaTexture(canvasWidth, canvasHeight)
        gl.bindRgba(textureId)
        GLUtils.texImage2D(android.opengl.GLES20.GL_TEXTURE_2D, 0, next, 0)
        Log.i(TAG, "plate ${canvasWidth}x${canvasHeight} scale=$scale label=${spec.label} "
            + "badge=${spec.badge} marks=${marks.size} "
            + "fired=${marks.filter { it.fired }.joinToString("/") { it.text }}")
        return true
    }

    /** The whole frame, because the marks are placed inside it rather than in a strip. */
    fun draw() {
        if (textureId == 0) return
        gl.drawOverlay(textureId, -1f, -1f, 1f, 1f)
    }

    fun close() {
        if (textureId != 0) {
            runCatching { gl.deleteTexture(textureId) }
            textureId = 0
        }
        bitmap?.recycle()
        bitmap = null
    }

    private fun paintMark(canvas: Canvas, mark: ChromeMark) {
        val left = mark.left * canvasWidth
        val top = mark.top * canvasHeight
        val width = mark.width * canvasWidth
        val height = mark.height * canvasHeight
        if (width <= 0f || height <= 0f) return
        val fired = spec.badge && mark.fired
        if (fired) {
            // Inset by half the line width, so the band straddles the picture's own edge and its outer
            // side lands exactly on it — the same construction as canvas `strokeRect`, which is what
            // the sheet's preview draws.
            framePaint.strokeWidth = stroke(height)
            canvas.drawRect(left + framePaint.strokeWidth / 2f, top + framePaint.strokeWidth / 2f,
                left + width - framePaint.strokeWidth / 2f, top + height - framePaint.strokeWidth / 2f,
                framePaint)
        }
        if (!spec.label || mark.text.isEmpty()) return
        val font = chromeFont(height)
        val padX = font * PAD_X
        val padY = font * PAD_Y
        textPaint.textSize = font
        val textWidth = textPaint.measureText(mark.text)
        val chipWidth = textWidth + padX * 2f
        val chipHeight = font * LINE_HEIGHT + padY * 2f
        val inset = font * INSET
        val x = left + inset
        val y = top + inset
        platePaint.color = if (fired) AMBER_PLATE else PLATE
        val radius = font * RADIUS
        rect.set(x, y, x + chipWidth, y + chipHeight)
        canvas.drawRoundRect(rect, radius, radius, platePaint)
        textPaint.color = if (fired) AMBER_TEXT else android.graphics.Color.WHITE
        canvas.drawText(mark.text, x + padX, y + padY + font * BASELINE, textPaint)
    }

    /** Mirrors `peChromeFont`: the tile's own height, floored against the frame. */
    private fun chromeFont(pictureHeight: Float) =
        maxOf(pictureHeight * FONT, canvasHeight * MIN_FONT)

    /** Mirrors the `stroke` in `pePaintPreviewChrome`: off the same font, floored at 2 device px. */
    private fun stroke(pictureHeight: Float): Float =
        maxOf(MIN_STROKE_FLOOR, chromeFont(pictureHeight) * BADGE)

    companion object {
        const val TAG = "TdExportChrome"
        const val MAX_WIDTH = 1920
        // Every one of these is `CHROME_LAYOUT` in `script.js`. The four below are the font-relative
        // multiples, taken from `.camera-label`'s 12px chip with 8px inset and padding and a 4px
        // radius; `BASELINE` is where the same chip's text sits inside its own box.
        const val FONT = 0.0333f
        const val MIN_FONT = 0.0135f
        const val INSET = 0.60f
        const val PAD_X = 0.60f
        const val PAD_Y = 0.28f
        const val RADIUS = 0.33f
        const val LINE_HEIGHT = 1.0f
        const val BASELINE = 0.80f
        const val BADGE = 0.14f
        /** Never thinner than two device pixels, whatever the frame size — a sub-pixel line vanishes. */
        const val MIN_STROKE_FLOOR = 2f
        val PLATE: Int = android.graphics.Color.argb(153, 0, 0, 0)
        val AMBER: Int = android.graphics.Color.rgb(255, 159, 10)
        val AMBER_PLATE: Int = android.graphics.Color.argb(235, 255, 159, 10)
        val AMBER_TEXT: Int = android.graphics.Color.rgb(36, 24, 0)
    }
}

/**
 * Where one view's picture lands in the frame, as fractions with `y` measured down from the top —
 * the page's convention, not the renderer's, because that is the space the preview measures in.
 * `fired` is the event's trigger answer and `text` the name to burn; both come straight from the
 * request, and the words are the page's language rather than the engine's.
 */
internal data class ChromeMark(
    val left: Float,
    val top: Float,
    val width: Float,
    val height: Float,
    val text: String,
    val fired: Boolean,
)
