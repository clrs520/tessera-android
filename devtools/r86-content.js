// R86 content-level agreement. Dimensions alone cannot tell a correctly turned frame from a
// upside-down one, and 180° never changes the box at all — so compare the pixels: the native
// retriever's answer and the platform's own decoder (a `<video>` drawn through a canvas, which is
// exactly the page's fallback path) must show the same picture, not merely the same shape.
//
// Each grid carries its spread; a flat grid would make the comparison vacuous, so it is reported
// instead of quietly passing.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
    const N = 10;
    const out = { files: {}, notes: [] };

    const gridOf = (src) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = N;
            canvas.height = N;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, N, N);
            const data = ctx.getImageData(0, 0, N, N).data;
            const cells = [];
            for (let i = 0; i < data.length; i += 4) cells.push((data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000);
            const mean = cells.reduce((a, b) => a + b, 0) / cells.length;
            const spread = Math.sqrt(cells.reduce((a, b) => a + (b - mean) ** 2, 0) / cells.length);
            resolve({ cells, dims: [image.naturalWidth, image.naturalHeight], spread: Math.round(spread) });
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });

    const turn = (cells, degrees) => {
        const at = (r, c) => cells[r * N + c];
        const result = new Array(N * N);
        for (let r = 0; r < N; r += 1) {
            for (let c = 0; c < N; c += 1) {
                const value = degrees === 0 ? at(r, c)
                    : degrees === 90 ? at(N - 1 - c, r)
                    : degrees === 180 ? at(N - 1 - r, N - 1 - c)
                    : at(c, N - 1 - r);
                result[r * N + c] = value;
            }
        }
        return result;
    };
    const meanAbs = (a, b) => +(a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length).toFixed(2);

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r86x${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 20000);
        window.TDashcamNative.requestThumb(id, path, millis, 160);
    });

    // A stream URL to clone: any feed that is already playing gives the host and the token.
    let feed = document.querySelector('video[src*="/media/"]');
    if (!feed) {
        document.querySelector('.video-card')?.click();
        for (let i = 0; i < 40 && !(feed = document.querySelector('video[src*="/media/"]')); i += 1) await sleep(500);
    }
    if (!feed) return JSON.stringify({ error: 'no /media/ template url' }, null, 1);
    const tail = feed.src.split('/media/')[1];
    const head = feed.src.slice(0, feed.src.indexOf('/media/'));
    const SECOND = 1;

    for (const name of ['r86-rot0.mp4', 'r86-rot90.mp4', 'r86-rot180.mp4', 'r86-rot270.mp4']) {
        const path = `/storage/emulated/0/Download/r86/${name}`;
        const entry = { native: null, decoder: null };
        const nativeUrl = await nativeThumb(path, SECOND * 1000);
        if (!nativeUrl) { out.files[name] = { failed: 'native thumb absent' }; continue; }
        entry.native = await gridOf(nativeUrl);

        const probe = document.createElement('video');
        probe.muted = true;
        probe.preload = 'auto';
        probe.src = `${head}/media/${tail.split('/')[0]}/${b64(path).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
        const drawn = await new Promise((resolve) => {
            let settled = false;
            const finish = (value) => { if (settled) return; settled = true; resolve(value); };
            probe.onloadeddata = () => { probe.currentTime = SECOND; };
            probe.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 160;
                canvas.height = Math.max(1, Math.round(160 * probe.videoHeight / probe.videoWidth));
                canvas.getContext('2d').drawImage(probe, 0, 0, canvas.width, canvas.height);
                finish(canvas.toDataURL('image/jpeg', 0.7));
            };
            probe.onerror = () => finish(null);
            setTimeout(() => finish(null), 20000);
            probe.load();
        });
        probe.removeAttribute('src');
        try { probe.load(); } catch (e) { /* detached */ }
        if (!drawn) { out.files[name] = { native: { dims: entry.native.dims }, failed: 'decoder grab failed' }; continue; }
        entry.decoder = await gridOf(drawn);

        const diff = meanAbs(entry.native.cells, entry.decoder.cells);
        const scores = [0, 90, 180, 270].map((degrees) => ({
            degrees, diff: meanAbs(entry.native.cells, turn(entry.decoder.cells, degrees)),
        }));
        const best = scores.slice().sort((a, b) => a.diff - b.diff)[0];
        out.files[name] = {
            nativeDims: entry.native.dims,
            decoderDims: entry.decoder.dims,
            spreads: [entry.native.spread, entry.decoder.spread],
            directDiff: diff,
            bestTurn: best,
            scores,
            agree: diff <= 24 && best.degrees === 0,
            meaningful: entry.native.spread > 6 && entry.decoder.spread > 6,
        };
    }

    out.summary = {
        allAgree: Object.values(out.files).every((f) => f.agree === true),
        allMeaningful: Object.values(out.files).every((f) => f.meaningful === true),
        count: Object.keys(out.files).length,
    };
    window.__r86content = out;
    return JSON.stringify(out, null, 1);
})()
