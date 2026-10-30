// R87 read-only: where in the frame did the burned pixels actually land? A row histogram answers it
// without another encode, and the answer is a position, not a judgement.
(async () => {
    const OUT = '/storage/emulated/0/Download/Tessera_2026-10-09_09-00-00_0.0-6.0s_1c_1104x720.mp4';
    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r87h${Math.random().toString(36).slice(2, 7)}`;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, 640);
    });
    const src = await nativeThumb(OUT, 1000);
    if (!src) return JSON.stringify({ fatal: 'no thumb' });
    const img = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            resolve({ w: canvas.width, h: canvas.height,
                data: ctx.getImageData(0, 0, canvas.width, canvas.height).data });
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
    if (!img) return JSON.stringify({ fatal: 'decode failed' });
    const brightRows = new Array(img.h).fill(0);
    const brightCols = new Array(img.w).fill(0);
    let globalMax = 0;
    for (let y = 0; y < img.h; y += 1) {
        for (let x = 0; x < img.w; x += 1) {
            const i = (y * img.w + x) * 4;
            const luma = (img.data[i] * 299 + img.data[i + 1] * 587 + img.data[i + 2] * 114) / 1000;
            if (luma > globalMax) globalMax = luma;
            if (luma >= 150) {
                brightRows[y] += 1; brightCols[x] += 1;
            }
        }
    }
    const runs = [];
    let start = -1;
    brightRows.forEach((n, y) => {
        if (n > 0 && start < 0) start = y;
        if (n === 0 && start >= 0) { runs.push({ y0: start, y1: y - 1, px: brightRows.slice(start, y).reduce((a, b) => a + b, 0) }); start = -1; }
    });
    if (start >= 0) runs.push({ y0: start, y1: img.h - 1, px: brightRows.slice(start).reduce((a, b) => a + b, 0) });
    const xs = brightCols.map((n, x) => n > 0 ? x : -1).filter((x) => x >= 0);
    // Eight horizontal slices, so "the stamp is somewhere" is readable even if it is faint.
    const slices = [];
    for (let s = 0; s < 8; s += 1) {
        const y0 = Math.round(img.h * s / 8), y1 = Math.round(img.h * (s + 1) / 8);
        let max = 0, count = 0;
        for (let y = y0; y < y1; y += 1) {
            for (let x = 0; x < img.w; x += 1) {
                const i = (y * img.w + x) * 4;
                const luma = (img.data[i] * 299 + img.data[i + 1] * 587 + img.data[i + 2] * 114) / 1000;
                if (luma > max) max = luma;
                if (luma >= 150) count += 1;
            }
        }
        slices.push({ frameY: [Math.round(y0 * 720 / img.h), Math.round(y1 * 720 / img.h)],
            max: Math.round(max), lit: count });
    }
    return JSON.stringify({
        dims: [img.w, img.h], frameH720: 720, globalMax: Math.round(globalMax), slices,
        // Runs of consecutive bright rows, in thumbnail pixels and re-expressed as the frame's own 720.
        bands: runs.map((r) => ({ thumbY: [r.y0, r.y1],
            frameY: [Math.round(r.y0 * 720 / img.h), Math.round(r.y1 * 720 / img.h)], px: r.px })),
        xExtentFrame: xs.length ? [Math.round(Math.min(...xs) * 1104 / img.w), Math.round(Math.max(...xs) * 1104 / img.w)] : null,
    }, null, 1);
})()
