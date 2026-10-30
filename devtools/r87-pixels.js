// R87 read-only pixel diagnostic on the file the last export left behind: does the predicted block
// actually carry the bright glyphs, and is the source in that region already bright enough to hide
// them? This is the question the per-cell excess metric could not answer, and answering it does not
// need another encode.
(async () => {
    const OUT = '/storage/emulated/0/Download/Tessera_2026-10-09_09-00-00_0.0-6.0s_1c_1104x720.mp4';
    const SRC = '/storage/emulated/0/TeslaCam/SavedClips/2026-10-09_09-00-00/2026-10-09_09-00-00-front.mp4';
    const AT = 1000;
    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r87p${Math.random().toString(36).slice(2, 7)}`;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, 640);
    });
    const load = (src) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            resolve({ ctx, w: canvas.width, h: canvas.height,
                data: ctx.getImageData(0, 0, canvas.width, canvas.height).data });
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
    const stats = (img, x0, y0, w, h) => {
        let max = 0, bright = 0, sum = 0, n = 0;
        for (let y = y0; y < y0 + h && y < img.h; y += 1) {
            for (let x = x0; x < x0 + w && x < img.w; x += 1) {
                const i = (y * img.w + x) * 4;
                const luma = (img.data[i] * 299 + img.data[i + 1] * 587 + img.data[i + 2] * 114) / 1000;
                if (luma > max) max = luma;
                if (luma >= 225) bright += 1;
                sum += luma; n += 1;
            }
        }
        return { max: Math.round(max), bright, mean: Math.round(sum / Math.max(1, n)) };
    };

    const a = await load(await nativeThumb(SRC, AT));
    const b = await load(await nativeThumb(OUT, AT));
    if (!a || !b) return JSON.stringify({ fatal: `thumb missing src=${!!a} out=${!!b}` });
    // The block the sheet predicted, at 1104x720, mapped into each thumbnail's own pixels.
    const rect = { x: 421, y: 14, w: 261, h: 89 };
    const map = (img) => ({
        x0: Math.round(rect.x * img.w / 1104), y0: Math.round(rect.y * img.h / 720),
        w: Math.round(rect.w * img.w / 1104), h: Math.round(rect.h * img.h / 720)
    });
    const ma = map(a), mb = map(b);
    const rows = [];
    for (let band = 0; band < 3; band += 1) {
        const hh = Math.round(mb.h / 3);
        const box = (img, m) => stats(img, m.x0, m.y0 + band * hh, m.w, hh);
        rows.push({ band, src: box(a, ma), out: box(b, mb) });
    }
    const outside = (img) => stats(img, 0, Math.round(img.h * 0.6), img.w, Math.round(img.h * 0.4));
    return JSON.stringify({
        dims: { src: [a.w, a.h], out: [b.w, b.h] },
        block: { src: stats(a, ma.x0, ma.y0, ma.w, ma.h), out: stats(b, mb.x0, mb.y0, mb.w, mb.h) },
        bands: rows,
        lowerHalf: { src: outside(a), out: outside(b) },
        note: 'block = the predicted rect; bands split it into thirds top to bottom',
    }, null, 1);
})()
