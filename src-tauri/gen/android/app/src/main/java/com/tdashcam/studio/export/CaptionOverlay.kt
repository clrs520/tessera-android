package com.tdashcam.studio.export

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.util.Log
import java.util.Locale

/**
 * The watermark: the wall clock, the speed and the driving state, burned into the frames.
 *
 * Two things about it are deliberate. It is a **bitmap** rather than a shader because there is no
 * font in GL, and it is **one strip for the whole frame** rather than a label per view, because the
 * figures describe the car rather than any one camera and one upload per second of video is the
 * difference between an overlay and a bottleneck.
 *
 * Every size here is a fraction of the *frame height* — a 4K file has to carry a proportionally
 * bigger stamp, which the width fraction this replaced did not do. The numbers live in [Wm] and are
 * mirrored by `WM_LAYOUT` in `script.js`, whose preview paints the same arithmetic so 「预览」 is the
 * file rather than a prettier guess; change one and change the other.
 *
 * Readability comes from a stroke around the glyphs rather than from a black plate behind them: the
 * plate was what actually covered the picture, and an outline survives a bright sky at a fraction of
 * the area. [Wm.bg] still offers the plate for whoever wants it, and a soft gradient for snow.
 */
internal class CaptionOverlay(
    private val gl: GlRenderer,
    private val frameWidth: Int,
    private val frameHeight: Int,
    private val captions: List<CaptionSpec>,
    private val wm: WmSpec,
) {
    /**
     * The bitmap is painted into the frame minus its two side margins, so that span — not the full
     * width — is what it has to be sized against. Off the full width, the 0.96-wide rect squeezed
     * every glyph 4% horizontally while leaving its height alone, and the sheet's preview, which has
     * no such squeeze to apply, stopped being the file.
     */
    private val stripSpan = frameWidth * (1f - 2f * Wm.MARGIN)
    private val stripScale =
        if (stripSpan > 0f) minOf(stripSpan, MAX_STRIP_WIDTH.toFloat()) / stripSpan else 1f
    private val stripWidth = (stripSpan * stripScale).toInt().coerceAtLeast(64)
    private val upscale = if (stripWidth > 0) stripSpan / stripWidth.toFloat() else 1f

    private fun size(fraction: Float) = frameHeight * fraction * wm.scale * stripScale

    private val speedSize = size(Wm.SPEED)
    private val clockSize = size(Wm.CLOCK)
    private val detailSize = size(Wm.DETAIL)
    private val sourceSize = size(Wm.SOURCE)
    private val padX = detailSize * Wm.PAD_X
    private val padY = detailSize * Wm.PAD_Y
    private val lineGap = detailSize * Wm.LINE_GAP

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = TEXT_COLOR
        typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL)
    }
    private val boldPaint = Paint(fillPaint).apply {
        typeface = Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD)
    }
    private val strokePaint = Paint(fillPaint).apply {
        style = Paint.Style.STROKE
        color = STROKE_COLOR
        strokeJoin = Paint.Join.ROUND
    }
    private val platePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = PLATE_COLOR
        style = Paint.Style.FILL
    }
    private val veilPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val barTrackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = BAR_TRACK }
    private val barFillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = BAR_FILL }
    private val rect = RectF()

    private var textureId = 0
    private var bitmap: Bitmap? = null
    private var index = -2
    private var rows: List<Row> = emptyList()
    private var blockWidth = 0f
    private var blockHeight = 0f
    private var barFraction = -1f
    private var barRowHeight = 0f

    /** Where the picture actually is, as fractions from the top. [Wm.place] `auto` reads these. */
    private var paintedTop = 0f
    private var paintedBottom = 1f

    val isEmpty: Boolean get() = captions.isEmpty()

    /** Called once, from the composited frames, with the union of what the cells painted. */
    fun setPaintedArea(topFraction: Float, bottomFraction: Float) {
        // An inverted pair means nothing was ever measured — a view that produced no texture at all.
        // "The picture is everywhere" is the only safe reading of that: it leaves `auto` no free band,
        // so the stamp lands on the picture instead of in a bar that is not there.
        if (bottomFraction <= topFraction) {
            paintedTop = 0f
            paintedBottom = 1f
            return
        }
        if (paintedTop == topFraction && paintedBottom == bottomFraction) return
        paintedTop = topFraction.coerceIn(0f, 1f)
        paintedBottom = bottomFraction.coerceIn(0f, 1f)
    }

    /** Draw the watermark in force at `globalUs`, if there is one. */
    fun draw(globalUs: Long) {
        if (isEmpty) return
        val at = captionIndex(globalUs)
        if (at != index) {
            index = at
            if (!build(captions.getOrNull(at))) return
            render()
        }
        if (textureId == 0 || rows.isEmpty()) return
        val stripHeightPx = (bitmap?.height ?: 0).toFloat()
        if (stripHeightPx <= 0f) return

        // Everything is reasoned about as a fraction of the frame from the top, and turned into the
        // NDC the renderer wants only at the end: the anchors are easier to read this way, and the
        // `auto` band has to be compared against a picture position, which is itself a fraction.
        val height = stripHeightPx * upscale / frameHeight
        val margin = Wm.MARGIN
        val top = when (anchor(height)) {
            // 左上 is the one anchor that shares its corner with the burned camera name, so it starts
            // below that chip instead of under it — `topClear` is the chip's own bottom, as a fraction
            // of the frame, and 0 whenever the name is off or lives in another view.
            Anchor.TOP -> if (wm.place == "tl") {
                // `padY` is a bitmap pixel and the strip may be a stand-in for the frame, so the gap
                // has to be converted the same way the block's own height is.
                maxOf(margin, wm.topClear + padY * upscale / frameHeight)
            } else margin
            Anchor.CENTER -> (1f - height) / 2f
            Anchor.BOTTOM -> 1f - margin - height
            Anchor.BAND_TOP -> margin + ((paintedTop - margin - height) / 2f).coerceAtLeast(0f)
            Anchor.BAND_BOTTOM -> {
                val free = 1f - margin - paintedBottom - height
                paintedBottom + (free / 2f).coerceAtLeast(0f)
            }
        }
        gl.drawOverlay(textureId,
            -1f + 2f * margin, 1f - 2f * (top + height),
            1f - 2f * margin, 1f - 2f * top)
    }

    fun close() {
        if (textureId != 0) {
            runCatching { gl.deleteTexture(textureId) }
            textureId = 0
        }
        bitmap?.recycle()
        bitmap = null
    }

    private enum class Anchor { TOP, CENTER, BOTTOM, BAND_TOP, BAND_BOTTOM }

    /**
     * `auto` is the only anchor with a decision to make: a band the block fits into *entirely* is a
     * free band, and the stamp then costs no picture at all. Top first — the eye starts there.
     */
    private fun anchor(height: Float): Anchor {
        val margin = Wm.MARGIN
        return when (wm.place) {
            "tl", "tc", "tr" -> Anchor.TOP
            "bl", "bc", "br" -> Anchor.BOTTOM
            "auto" -> when {
                paintedTop - margin >= height -> Anchor.BAND_TOP
                1f - margin - paintedBottom >= height -> Anchor.BAND_BOTTOM
                else -> Anchor.TOP
            }
            else -> Anchor.TOP
        }
    }

    /** True when the block has anything to say; an entry with every field blank draws nothing. */
    private fun build(entry: CaptionSpec?): Boolean {
        val next = ArrayList<Row>(4)
        barFraction = -1f
        if (entry != null) {
            if (entry.clk.isNotEmpty() || entry.spd.isNotEmpty()) {
                val row = Row(speedSize * Wm.LINE_HEIGHT)
                if (entry.clk.isNotEmpty()) row.runs.add(Run(entry.clk, clockSize, false, ALPHA_CLOCK, 0f))
                if (entry.spd.isNotEmpty()) {
                    // The column stays reserved for the widest reading so nothing on the line slides
                    // sideways between seconds, but the digits sit at the **right** of it: the unit is
                    // the next run, and a left-aligned `9.4` in a `888.8` column leaves it hanging half
                    // a number away — 「单位 km/h 距离车速数字的距离太远了」.
                    row.runs.add(Run(entry.spd, speedSize, true, 255,
                        if (entry.clk.isNotEmpty()) speedSize * 0.28f else 0f, SPEED_REF,
                        rightAlign = true))
                    row.runs.add(Run(wm.unit, clockSize * 0.72f, false, ALPHA_UNIT, speedSize * 0.12f))
                }
                next.add(row)
                if (entry.bar >= 0f) {
                    barFraction = entry.bar.coerceIn(0f, 1f)
                    barRowHeight = row.height
                }
            }
            if (entry.gps.isNotEmpty()) next.add(Row(detailSize * Wm.LINE_HEIGHT).apply { runs.add(Run(entry.gps, detailSize, false, ALPHA_DETAIL, 0f)) })
            if (entry.st.isNotEmpty()) next.add(Row(detailSize * Wm.LINE_HEIGHT).apply { runs.add(Run(entry.st, detailSize, false, ALPHA_STATE, 0f)) })
            if (entry.src.isNotEmpty()) next.add(Row(sourceSize * Wm.LINE_HEIGHT).apply { runs.add(Run(entry.src, sourceSize, false, ALPHA_SOURCE, 0f)) })
        }
        rows = next
        if (next.isEmpty()) return false
        measure()
        return true
    }

    private fun measure() {
        var widest = 0f
        rows.forEach { row ->
            var width = 0f
            row.runs.forEach { run -> width += run.space + widthOf(run) }
            row.width = width
            widest = maxOf(widest, width)
        }
        blockWidth = widest + padX * 2f
        blockHeight = rows.sumOf { it.height.toDouble() }.toFloat() +
            lineGap * (rows.size - 1).coerceAtLeast(0) + padY * 2f
    }

    /**
     * The run's advance **at its own size**. This used to call `lockedWidth(paintFor(run), run)`
     * directly, and `textSize` is only ever assigned inside the draw loop — so measuring ran with
     * whatever the shared `Paint` last carried: 12sp on the first second, then the previous run's
     * size. Identical rows therefore came out `block=313x89` one second and `265x89` the next (the
     * engine's own log, before this), which is a stamp that slides sideways between seconds, and a
     * right-anchored row placed by an under-measured width starts too far right and gets cut by the
     * edge of the bitmap — 「右上角/右下角内容显示不完整」. One accessor, used by both sides, cannot
     * disagree with itself.
     */
    private fun widthOf(run: Run): Float {
        val paint = paintFor(run)
        val was = paint.textSize
        paint.textSize = run.size
        val width = lockedWidth(paint, run)
        paint.textSize = was
        return width
    }

    /**
     * The width the *widest possible* version of this string would occupy. Without it a speed of
     * `9.4` next second and `104.7` the one after slides every other field on the line sideways, and
     * a watermark that jitters reads as a bug rather than as data. The digit substitution alone is
     * not enough: it fixes the glyph values but not the digit *count*, so a field whose format is
     * known carries a reference of its own — `SPEED_REF` for the speed, which is always one decimal.
     */
    private fun lockedWidth(paint: Paint, run: Run): Float {
        val reference = run.reference ?: buildString(run.text.length) {
            run.text.forEach { ch -> append(if (ch.isDigit()) '8' else ch) }
        }
        return maxOf(paint.measureText(run.text), paint.measureText(reference))
    }

    private fun paintFor(run: Run): Paint = if (run.bold) boldPaint else fillPaint

    private fun render() {
        val height = (padY * 2f + rows.sumOf { it.height.toDouble() }.toFloat() +
            lineGap * (rows.size - 1).coerceAtLeast(0)).toInt().coerceAtLeast(1)
        var target = bitmap
        if (target == null || target.width != stripWidth || target.height != height) {
            target?.recycle()
            target = Bitmap.createBitmap(stripWidth, height, Bitmap.Config.ARGB_8888)
            bitmap = target
        }
        target.eraseColor(0)
        val canvas = Canvas(target)

        val align = when (wm.place) {
            "tl", "bl" -> Align.LEFT
            "tr", "br" -> Align.RIGHT
            else -> Align.CENTER
        }
        // The block's own box in strip pixels. The veil shades *this* rather than the whole frame: a
        // band across the full width is precisely the occlusion the stamp exists to avoid.
        val blockLeft = when (align) {
            Align.LEFT -> 0f
            Align.RIGHT -> stripWidth - blockWidth
            else -> (stripWidth - blockWidth) / 2f
        }
        if (wm.bg == "veil") {
            veilPaint.shader = LinearGradient(
                0f, height.toFloat(), 0f, 0f,
                intArrayOf(VEIL_STRONG, VEIL_TRANSPARENT), null, Shader.TileMode.CLAMP
            )
            val overhang = blockWidth * Wm.VEIL_OVERHANG
            canvas.drawRect(blockLeft - overhang, 0f, blockLeft + blockWidth + overhang,
                height.toFloat(), veilPaint)
            veilPaint.shader = null
        }

        var cursorY = padY
        rows.forEach { row ->
            val rowX = when (align) {
                Align.LEFT -> padX
                Align.RIGHT -> stripWidth - padX - row.width
                else -> (stripWidth - row.width) / 2f
            }
            if (wm.bg == "plate") {
                rect.set(rowX - padX * 0.6f, cursorY, rowX + row.width + padX * 0.6f, cursorY + row.height)
                canvas.drawRoundRect(rect, row.runs.last().size * Wm.RADIUS, row.runs.last().size * Wm.RADIUS, platePaint)
            }
            var x = rowX
            val baseline = cursorY + row.height * 0.78f
            row.runs.forEach { run ->
                x += run.space
                val paint = paintFor(run)
                paint.textSize = run.size
                paint.alpha = run.alpha
                strokePaint.textSize = run.size
                strokePaint.strokeWidth = run.size * Wm.STROKE_WIDTH * 2f
                val advance = widthOf(run)
                val textX = if (run.rightAlign) x + advance - paint.measureText(run.text) else x
                // The stroke is centred on the glyph edge in Skia exactly as it is on canvas, so it
                // is doubled here to leave half of it *outside* the letter. That half is the whole
                // reason no black plate is needed any more.
                canvas.drawText(run.text, textX, baseline, strokePaint)
                paint.setShadowLayer(run.size * Wm.SHADOW_BLUR, 0f, run.size * 0.05f, SHADOW_COLOR)
                canvas.drawText(run.text, textX, baseline, paint)
                paint.clearShadowLayer()
                x += advance
            }
            cursorY += row.height + lineGap
        }

        if (barFraction >= 0f) {
            val barW = stripWidth * Wm.BAR_WIDTH
            val barH = (frameHeight * Wm.BAR_HEIGHT * wm.scale * stripScale).coerceAtLeast(1f)
            val barX = when (align) {
                Align.LEFT -> padX
                Align.RIGHT -> stripWidth - padX - barW
                else -> (stripWidth - barW) / 2f
            }
            val barY = padY + barRowHeight - barH * 1.6f
            canvas.drawRect(barX, barY, barX + barW, barY + barH, barTrackPaint)
            canvas.drawRect(barX, barY, barX + barW * barFraction, barY + barH, barFillPaint)
        }

        if (textureId == 0) {
            textureId = gl.newRgbaTexture(stripWidth, height)
        }
        gl.uploadRgba(textureId, target)
        // What the stamp costs, in the same units the sheet's preview quotes: the block's own box as
        // a share of the frame. Without this the only way to check a size change is to eyeball a file.
        val area = blockWidth * upscale * blockHeight * upscale / (frameWidth * frameHeight) * 100f
        Log.i(TAG, "wm place=${wm.place} bg=${wm.bg} scale=${wm.scale} " +
            "block=${(blockWidth * upscale).toInt()}x${(blockHeight * upscale).toInt()} " +
            "area=${String.format(Locale.US, "%.1f", area)}%")
    }

    /**
     * The last entry that has begun by `globalUs`. The series is built by the page in increasing
     * time and looked up per output frame, so walking forward from the previous answer is the whole
     * algorithm — a binary search would be a correctness guarantee nobody has to pay for at 30 Hz.
     */
    private fun captionIndex(globalUs: Long): Int {
        var at = index.coerceAtLeast(-1)
        while (at + 1 < captions.size && captions[at + 1].us <= globalUs) at++
        while (at >= 0 && captions[at].us > globalUs) at--
        return at
    }

    private enum class Align { LEFT, CENTER, RIGHT }

    private class Row(val height: Float) {
        val runs = ArrayList<Run>(3)
        var width = 0f
    }

    private class Run(val text: String, val size: Float, val bold: Boolean, val alpha: Int,
                      val space: Float, val reference: String? = null,
                      val rightAlign: Boolean = false)

    private companion object {
        const val TAG = "TdExportCaption"
        const val MAX_STRIP_WIDTH = 1920
        /** The speed is always one decimal, so this is the widest reading the column can hold. */
        const val SPEED_REF = "888.8"
        const val TEXT_COLOR = 0xFFFFFFFF.toInt()
        const val STROKE_COLOR = 0xB8000000.toInt()
        const val SHADOW_COLOR = 0x8C000000.toInt()
        const val PLATE_COLOR = 0x99000000.toInt()
        const val VEIL_STRONG = 0x80000000.toInt()
        const val VEIL_TRANSPARENT = 0x00000000
        const val BAR_TRACK = 0x38FFFFFF.toInt()
        const val BAR_FILL = 0xFF42A5F5.toInt()
        const val ALPHA_CLOCK = 242
        const val ALPHA_DETAIL = 235
        const val ALPHA_STATE = 228
        const val ALPHA_UNIT = 184
        const val ALPHA_SOURCE = 153
    }
}

/**
 * The watermark's static half, sent once per export. Mirrors `WM_LAYOUT` / `WM_PLACES` in
 * `script.js`, which is what lets the sheet's preview show the real thing.
 */
internal data class WmSpec(
    val place: String = "tc",
    val bg: String = "stroke",
    val scale: Float = 1f,
    val unit: String = "km/h",
    /** How far below the top edge the 左上 stamp has to start, as a fraction of the frame height. */
    val topClear: Float = 0f,
)

/** Every number that decides where the watermark lands and how big it is. Fractions of frame height. */
internal object Wm {
    const val SPEED = 0.032f
    const val CLOCK = 0.019f
    const val DETAIL = 0.017f
    const val SOURCE = 0.014f
    const val LINE_HEIGHT = 1.26f
    const val LINE_GAP = 0.34f
    const val BAR_WIDTH = 0.13f
    const val BAR_HEIGHT = 0.0030f
    const val MARGIN = 0.02f
    const val VEIL_OVERHANG = 0.06f
    const val RADIUS = 0.18f
    const val PAD_X = 0.34f
    const val PAD_Y = 0.16f
    const val STROKE_WIDTH = 0.055f
    const val SHADOW_BLUR = 0.10f
}
