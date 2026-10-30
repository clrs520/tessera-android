// R86 before/after evidence. `r86-export-front.mp4` is the file 1.2.125 wrote for the 90° clip and
// `r86-ab-single-rot90.mp4` is what 1.2.126 writes for the same clip, range and canvas; this puts
// both thumbnails on screen for a screenshot and settles the 180° question, which a 12x12 grid
// cannot separate on a near-centrosymmetric screen recording, by scoring identity against the
// one-quarter-past hypothesis at 24x24.
(async () => {
    const N = 24;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pairs: {}, fine180: {} };

    const nativeThumb = (path, millis, width) => new Promise((resolve) => {
        const id = `r86v${Math.random().toString(36).slice(2, 7)}`;
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
            canvas.width = N; canvas.height = N;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, N, N);
            const d = ctx.getImageData(0, 0, N, N).data;
            const cells = [];
            for (let i = 0; i < d.length; i += 4) cells.push((d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000);
            resolve({ cells, dims: [image.naturalWidth, image.naturalHeight] });
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
    const turn = (cells, degrees) => {
        const at = (r, c) => cells[r * N + c];
        const result = new Array(N * N);
        for (let r = 0; r < N; r += 1) {
            for (let c = 0; c < N; c += 1) {
                result[r * N + c] = degrees === 0 ? at(r, c)
                    : degrees === 90 ? at(N - 1 - c, r)
                    : degrees === 180 ? at(N - 1 - r, N - 1 - c)
                    : at(c, N - 1 - r);
            }
        }
        return result;
    };
    const meanAbs = (a, b) => +(a.reduce((s, v, i) => s + Math.abs(v - (b[i] ?? 0)), 0) / a.length).toFixed(2);

    const R86 = '/storage/emulated/0/TeslaCam/SavedClips/2026-10-17_11-30-00';
    const DL = '/storage/emulated/0/Download';
    const pairs = {
        // 1.2.125 output vs 1.2.126 output for the declared-90 clip.
        pre90: `${DL}/r86-pre-rot90.mp4`,
        post90: `${DL}/r86-ab-single-rot90.mp4`,
        source90: `${R86}/2026-10-17_11-30-00-front.mp4`,
        source180: `${R86}/2026-10-17_11-30-00-right_pillar.mp4`,
        export180: `${DL}/r86-out-180.mp4`,
    };
    const grids = {};
    const urls = {};
    for (const [key, path] of Object.entries(pairs)) {
        const url = await nativeThumb(path, 1000, 320);
        urls[key] = url;
        grids[key] = url ? await gridOf(url) : null;
        out.pairs[key] = grids[key] ? { dims: grids[key].dims, chars: url.length } : { missing: true };
        await sleep(200);
    }

    if (grids.pre90 && grids.post90 && grids.source90) {
        out.comparePrePost = {
            preVsSource: meanAbs(grids.source90.cells, grids.pre90.cells),
            postVsSource: meanAbs(grids.source90.cells, grids.post90.cells),
            preVsPost: meanAbs(grids.pre90.cells, grids.post90.cells),
            preIsSourceTurned180: meanAbs(grids.source90.cells, turn(grids.pre90.cells, 180)),
        };
    }
    // The 180° claim, scored at 24x24: identity (fixed) against the 180-off hypothesis (the coded
    // picture, which is what the old build produced).
    if (grids.source180 && grids.export180) {
        out.fine180 = {
            identity: meanAbs(grids.source180.cells, grids.export180.cells),
            offBy180: meanAbs(grids.source180.cells, turn(grids.export180.cells, 180)),
            offBy90: meanAbs(grids.source180.cells, turn(grids.export180.cells, 90)),
            offBy270: meanAbs(grids.source180.cells, turn(grids.export180.cells, 270)),
        };
        out.fine180.identityWins = out.fine180.identity <= Math.min(out.fine180.offBy90, out.fine180.offBy180, out.fine180.offBy270);
    }

    // Side-by-side for the screenshot: pre-fix on the left, post-fix on the right, source on top.
    document.getElementById('r86-evidence')?.remove();
    const panel = document.createElement('div');
    panel.id = 'r86-evidence';
    panel.setAttribute('style', 'position:fixed;left:0;top:120px;z-index:99999;background:#000;padding:6px;'
        + 'display:flex;flex-direction:column;gap:6px;width:100%;');
    const row = (label, key) => {
        const wrap = document.createElement('div');
        const caption = document.createElement('div');
        caption.setAttribute('style', 'color:#fff;font:12px monospace');
        caption.textContent = label;
        const img = document.createElement('img');
        img.setAttribute('style', 'width:100%;display:block;background:#111');
        img.src = urls[key];
        wrap.appendChild(caption);
        wrap.appendChild(img);
        panel.appendChild(wrap);
    };
    row('源片 front（容器声明 90°，应显示为横向）', 'source90');
    row('1.2.125 导出（改前）', 'pre90');
    row('1.2.126 导出（改后）', 'post90');
    document.body.appendChild(panel);
    await sleep(1200);
    out.overlay = { present: !!document.getElementById('r86-evidence'), imgs: panel.querySelectorAll('img').length };
    window.__r86evidence = { urls, grids };
    return JSON.stringify(out, null, 1);
})()
