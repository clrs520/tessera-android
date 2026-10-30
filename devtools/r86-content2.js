// R86 content-level rotation census, native path only. One coded bitstream declared at 0/90/180/270
// through the container transform; the four thumbnails the retriever returns must then differ by
// exactly those turns. Nothing else in the app is involved, so no decoder slot can starve the
// comparison and no second implementation can muddy it.
(async () => {
    const N = 12;
    const out = { files: {}, turns: {}, verdict: {} };
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r86y${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, 160);
    });

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
            resolve({
                cells,
                dims: [image.naturalWidth, image.naturalHeight],
                spread: Math.round(Math.sqrt(cells.reduce((a, b) => a + (b - mean) ** 2, 0) / cells.length)),
            });
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
    const meanAbs = (a, b) => +(a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length).toFixed(2);

    const names = ['r86-rot0.mp4', 'r86-rot90.mp4', 'r86-rot180.mp4', 'r86-rot270.mp4'];
    for (const name of names) {
        const url = await nativeThumb(`/storage/emulated/0/Download/r86/${name}`, 1000);
        out.files[name] = url ? await gridOf(url) : { failed: 'no thumb' };
        await sleep(300);
    }
    const base = out.files['r86-rot0.mp4'];
    if (!base || !base.cells) return JSON.stringify({ error: 'baseline grid missing', out }, null, 1);

    // Which declared turn best maps the 0° answer onto each other answer, and how far off it is.
    for (const name of names.slice(1)) {
        const other = out.files[name];
        if (!other || !other.cells) continue;
        const scores = [0, 90, 180, 270].map((degrees) => ({
            degrees, diff: meanAbs(base.cells, turn(other.cells, degrees)),
        }));
        const sorted = scores.slice().sort((a, b) => a.diff - b.diff);
        out.turns[name] = {
            dims: other.dims,
            baselineDims: base.dims,
            scores,
            best: sorted[0],
            runnerUp: sorted[1],
            separated: sorted[1].diff - sorted[0].diff > 4,
            declared: Number(name.match(/rot(\d+)/)[1]),
        };
    }

    out.spreads = Object.fromEntries(names.map((n) => [n, out.files[n]?.spread]));
    out.verdict = {
        allFourCameBack: names.every((n) => out.files[n]?.cells),
        meaningfullyTextured: names.every((n) => (out.files[n]?.spread ?? 0) > 6),
        // The turn that maps each answer back onto the 0° one. A platform that applies the
        // container's clockwise degrees answers (360 - declared) % 360; one that ignores the
        // metadata answers 0.
        appliedTurnPerDeclared: Object.fromEntries(Object.entries(out.turns).map(([n, t]) => [n, t.best.degrees])),
        anyTurnWasApplied: Object.values(out.turns).every((t) => t.best.degrees !== 0 || !t.separated),
        everyDeclaredTurnConfirmed: Object.values(out.turns).every((t) => t.best.degrees === (360 - t.declared) % 360),
        comparisonsSeparated: Object.values(out.turns).every((t) => t.separated),
        dimsSwappedFor90And270: (() => {
            const b = out.files['r86-rot0.mp4'].dims;
            const q = out.files['r86-rot90.mp4'].dims;
            return b[0] < b[1] && q[0] > q[1];
        })(),
    };
    window.__r86content2 = out;
    return JSON.stringify(out, null, 1);
})()
