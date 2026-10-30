// The 180° case, measured the way its own display asks for: portrait canvas, content cropped to
// what is actually painted, and identity scored against every quarter-turn hypothesis at 24x24.
(async () => {
    const N = 24, TAKE = 3000000;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const R86 = '/storage/emulated/0/TeslaCam/SavedClips/2026-10-17_11-30-00';
    const source = `${R86}/2026-10-17_11-30-00-right_pillar.mp4`;
    const out = { exported: null, scores: {} };
    document.getElementById('r86-evidence')?.remove();
    const nativeThumb = (path, millis, width) => new Promise((resolve) => {
        const id = `r86w${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, width);
    });
    const gridOf = (src) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
            const w = canvas.width, h = canvas.height;
            const scan = ctx.getImageData(0, 0, w, h).data;
            const lit = (x, y) => { const i = (y * w + x) * 4; return scan[i] + scan[i + 1] + scan[i + 2] > 24; };
            const colLit = (x) => { for (let y = 0; y < h; y += 2) if (lit(x, y)) return true; return false; };
            const rowLit = (y) => { for (let x = 0; x < w; x += 2) if (lit(x, y)) return true; return false; };
            let left = 0, top = 0, right = w - 1, bottom = h - 1;
            while (left < right && !colLit(left)) left += 1;
            while (right > left && !colLit(right)) right -= 1;
            while (top < bottom && !rowLit(top)) top += 1;
            while (bottom > top && !rowLit(bottom)) bottom -= 1;
            const patch = ctx.getImageData(left, top, Math.max(1, right - left + 1), Math.max(1, bottom - top + 1));
            const cells = [];
            for (let r = 0; r < N; r += 1) for (let c = 0; c < N; c += 1) {
                const x = Math.min(patch.width - 1, Math.floor((c + 0.5) * patch.width / N));
                const y = Math.min(patch.height - 1, Math.floor((r + 0.5) * patch.height / N));
                const i = (y * patch.width + x) * 4, d = patch.data;
                cells.push((d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000);
            }
            resolve({ cells, box: [left, top, right - left + 1, bottom - top + 1], dims: [w, h] });
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
    const turn = (cells, degrees) => {
        const at = (r, c) => cells[r * N + c];
        const result = new Array(N * N);
        for (let r = 0; r < N; r += 1) for (let c = 0; c < N; c += 1) {
            result[r * N + c] = degrees === 0 ? at(r, c) : degrees === 90 ? at(N - 1 - c, r)
                : degrees === 180 ? at(N - 1 - r, N - 1 - c) : at(c, N - 1 - r);
        }
        return result;
    };
    const meanAbs = (a, b) => +(a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0) / a.length).toFixed(2);

    const outPath = '/storage/emulated/0/Download/r86-out-180-portrait.mp4';
    let phase = null;
    const previous = window.__tdashcamExportProgress;
    window.__tdashcamExportProgress = (payload) => { previous?.(payload); if (payload && payload.id === 86777) phase = payload.phase; };
    window.TDashcamNative.startExport(JSON.stringify({
        id: 86777, outPath, width: 576, height: 1280, fps: 30, durationUs: TAKE,
        rows: 1, cols: 1, preferHardware: true,
        cameras: [{ camera: 'right_pillar', cell: 0, segments: [{ path: source, clipStartUs: 0, clipEndUs: TAKE, globalStartUs: 0 }] }],
    }));
    for (let i = 0; i < 180 && phase !== 'done' && phase !== 'error' && phase !== 'cancelled'; i += 1) await sleep(1000);
    window.__tdashcamExportProgress = previous;
    out.exportPhase = phase;
    if (phase !== 'done') return JSON.stringify(out, null, 1);
    await sleep(1200);
    const gSource = await gridOf(await nativeThumb(source, 1000, 320));
    const gExport = await gridOf(await nativeThumb(outPath, 1000, 320));
    if (!gSource || !gExport) return JSON.stringify({ ...out, failed: 'grid missing' }, null, 1);
    out.boxes = { source: gSource.box, exported: gExport.box };
    out.dims = { source: gSource.dims, exported: gExport.dims };
    for (const degrees of [0, 90, 180, 270]) out.scores[degrees] = meanAbs(gSource.cells, turn(gExport.cells, degrees));
    const sorted = Object.entries(out.scores).sort((a, b) => a[1] - b[1]);
    out.winner = Number(sorted[0][0]);
    out.margin = +(sorted[1][1] - sorted[0][1]).toFixed(2);
    return JSON.stringify(out, null, 1);
})()
