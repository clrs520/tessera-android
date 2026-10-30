// R88: put the exported marks on screen as pictures. The counts said 1002 amber pixels, and a count
// can be right about a mark that is still illegible — so dump the frame and the crop of the corner
// the camera name lives in, and look.
//
// Reads the app's own Download directory through the page's helper and returns base64 PNGs; no URL,
// no token.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const files = [
        { name: 'Tessera_2026-10-09_10-00-00_0.1-6.1s_2c_1776x576.mp4', tag: 'two', crop: { x: 0, y: 0, w: 0.24, h: 0.34 } },
        { name: 'Tessera_2026-10-09_10-00-00_0.0-6.0s_2c_1776x576.mp4', tag: 'two-off', crop: { x: 0, y: 0, w: 0.24, h: 0.34 } },
        { name: 'Tessera_2026-10-09_10-00-00_0.2-6.2s_1c_1104x720.mp4', tag: 'one', crop: { x: 0, y: 0, w: 0.34, h: 0.34 } },
    ];
    const grab = (path, millis, width) => new Promise((resolve) => {
        const id = `r88m${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, width);
    });
    const load = (src) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
    const dir = androidDownloadDir();
    const images = [];
    const report = [];
    for (const file of files) {
        const src = await grab(joinPath(dir, file.name), 2000, 960);
        const img = src ? await load(src) : null;
        if (!img) { report.push({ tag: file.tag, missing: true }); continue; }
        const box = (rect, outW, outH) => {
            const canvas = document.createElement('canvas');
            canvas.width = outW; canvas.height = outH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = outW > img.naturalWidth * rect.w;
            ctx.drawImage(img, rect.x * img.naturalWidth, rect.y * img.naturalHeight,
                rect.w * img.naturalWidth, rect.h * img.naturalHeight, 0, 0, outW, outH);
            return canvas.toDataURL('image/png').split(',')[1];
        };
        images.push({ file: `r88-mark-${file.tag}.png`,
            b64: box({ x: 0, y: 0, w: 1, h: 1 }, img.naturalWidth, img.naturalHeight) });
        images.push({ file: `r88-crop-${file.tag}.png`, b64: box(file.crop, 720, 720) });
        report.push({ tag: file.tag, dims: [img.naturalWidth, img.naturalHeight] });
    }
    return JSON.stringify({ report, images });
})()
