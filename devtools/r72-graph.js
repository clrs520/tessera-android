// R72 speed-curve verification: the container must be visible, the canvas must have real geometry,
// and the pixels must actually be painted — a `visible` class with an empty canvas is exactly the
// failure the user reported, so state alone is not the acceptance test.
(() => {
    const c = document.getElementById('speedGraphContainer');
    const cv = document.getElementById('speedGraphCanvas');
    if (!c || !cv) return JSON.stringify({ error: 'no speed graph elements' });
    const cb = c.getBoundingClientRect();
    const out = {
        vw: window.innerWidth, vh: window.innerHeight,
        visible: c.classList.contains('visible'),
        container: { w: Math.round(cb.width), h: Math.round(cb.height), x: Math.round(cb.left), y: Math.round(cb.top) },
        canvasCss: { w: Math.round(cv.getBoundingClientRect().width), h: Math.round(cv.getBoundingClientRect().height) },
        canvasBits: { w: cv.width, h: cv.height },
        display: getComputedStyle(c).display, opa: getComputedStyle(c).opacity,
        span: viewer.videoControls?.speedGraphSpan,
        tele: viewer.metadataManager.currentMetadata.length,
        hasNum: viewer.metadataManager.hudHasNumbers(),
    };

    const ctx = cv.getContext('2d');
    if (cv.width > 2 && cv.height > 2) {
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let painted = 0, colours = new Set();
        for (let i = 3; i < d.length; i += 4) {
            if (d[i] > 8) {
                painted++;
                if (colours.size < 12) colours.add(`${d[i - 3]},${d[i - 2]},${d[i - 1]}`);
            }
        }
        out.paintedPixels = painted;
        out.paintedRatio = Math.round(painted / (cv.width * cv.height) * 1000) / 1000;
        out.distinctColours = colours.size;
        out.colourSample = [...colours].slice(0, 5);
    }
    return JSON.stringify(out);
})()
