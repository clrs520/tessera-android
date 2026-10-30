// R91: the 左上 file keeps showing one bright band where the probe expected two (chip, then stamp),
// so this stops guessing at thresholds and prints the actual row profile of the top quarter of the
// frame — how many bright pixels per row, and how far left and right they reach. The chip is short
// and hugs the picture's left edge; the stamp's first row is wide. The profile tells them apart.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const name = 'Tessera_2026-10-09_10-00-00_0.3-1.9s_1c_1104x720.mp4';
    const AT = 1200;
    const id = `r91p${Math.random().toString(36).slice(2, 7)}`;
    const url = await new Promise((resolve) => {
        let done = false;
        const previous = window.__tdashcamNativeThumb;
        window.__tdashcamNativeThumb = (got, data) => {
            if (previous) previous(got, data);
            if (got === id && !done) { done = true; resolve(typeof data === 'string' ? data : null); }
        };
        for (let i = 0; i < 4; i += 1) {
            try { window.TDashcamNative.requestThumb(id, `/storage/emulated/0/Download/${name}`, AT, 1100); break; }
            catch (e) { if (i === 3) { resolve(null); return; } }
        }
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
    });
    if (!url) return JSON.stringify({ fatal: 'no frame' });
    const img = new Image();
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const luma = (x, y) => { const i = (y * canvas.width + x) * 4;
        return (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000; };
    const rows = [];
    for (let y = 0; y < Math.round(canvas.height * 0.25); y += 1) {
        let n = 0, x0 = 1e9, x1 = -1;
        for (let x = 0; x < canvas.width; x += 1) {
            if (luma(x, y) >= 90) { n += 1; if (x < x0) x0 = x; if (x > x1) x1 = x; }
        }
        rows.push(n ? `${y}:${n}@${x0}-${x1}` : null);
    }
    return JSON.stringify({ thumb: [canvas.width, canvas.height],
        profile: rows.filter(Boolean).join(' ') });
})()
