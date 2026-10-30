// R86 export half: the only rotation in this app that is applied by hand (GL bakes the turn into
// the pixels), so it is the only place a double turn is possible. Export the 90° clip at its own
// display aspect — so the cell is full and no letterbox distorts the comparison — then ask the
// same retriever for a thumbnail of the OUTPUT file and check it against the source's thumbnail.
// Identity must win, and win clearly: a baked-once-correctly frame matches, a frame that got
// turned twice or not at all shows up as a 90/180/270 winner.
(async () => {
    const DIR = '/storage/emulated/0/TeslaCam/SavedClips/2026-10-17_11-30-00';
    const OUT = '/storage/emulated/0/Download/r86-export-front.mp4';
    const SOURCE = `${DIR}/2026-10-17_11-30-00-front.mp4`;
    const TAKE = 3000000;
    const N = 12;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { started: null, phases: [], verdict: {} };

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r86z${Math.random().toString(36).slice(2, 7)}`;
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
            canvas.width = N; canvas.height = N;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, N, N);
            const data = ctx.getImageData(0, 0, N, N).data;
            const cells = [];
            for (let i = 0; i < data.length; i += 4) cells.push((data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000);
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
    const meanAbs = (a, b) => +(a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / a.length).toFixed(2);

    const request = {
        id: 86,
        outPath: OUT,
        // 1280x576 is the clip's own displayed aspect once its container rotation is applied, so
        // the single cell is filled edge to edge and the grids compare without a letterbox.
        width: 1280,
        height: 576,
        fps: 30,
        durationUs: TAKE,
        rows: 1,
        cols: 1,
        preferHardware: true,
        cameras: [{
            camera: 'front',
            cell: 0,
            segments: [{
                path: SOURCE,
                clipStartUs: 0,
                clipEndUs: TAKE,
                globalStartUs: 0,
            }],
        }],
    };

    const seen = [];
    window.__tdashcamExportProgress = (payload) => {
        if (payload && payload.id === 86) seen.push(`${payload.phase}:${payload.percent ?? ''}`);
    };
    const native = window.TDashcamNative;
    if (!native || typeof native.startExport !== 'function') return JSON.stringify({ fatal: 'no startExport' });
    out.started = native.startExport(JSON.stringify(request));

    let finished = null;
    for (let i = 0; i < 240; i += 1) {
        await sleep(1000);
        if (seen.some((s) => s.startsWith('done') || s.startsWith('error') || s.startsWith('cancelled'))) { finished = seen[seen.length - 1]; break; }
    }
    out.phases = seen.slice(-6);
    out.progressCount = seen.length;
    if (!finished || !finished.startsWith('done')) {
        out.verdict.exportSucceeded = false;
        out.verdict.stoppedAt = finished;
        return JSON.stringify(out, null, 1);
    }
    out.verdict.exportSucceeded = true;

    await sleep(1500);
    const sourceGrid = await gridOf(await nativeThumb(SOURCE, 1000));
    const exportGrid = await gridOf(await nativeThumb(OUT, 1000));
    if (!sourceGrid || !exportGrid) {
        out.verdict.reason = `thumb missing source=${!!sourceGrid} exported=${!!exportGrid}`;
        return JSON.stringify(out, null, 1);
    }
    const scores = [0, 90, 180, 270].map((degrees) => ({
        degrees, diff: meanAbs(sourceGrid.cells, turn(exportGrid.cells, degrees)),
    }));
    const sorted = scores.slice().sort((a, b) => a.diff - b.diff);
    out.compare = {
        sourceDims: sourceGrid.dims,
        exportedDims: exportGrid.dims,
        scores,
        best: sorted[0],
        runnerUp: sorted[1],
    };
    out.verdict = {
        ...out.verdict,
        identityWins: sorted[0].degrees === 0,
        separated: sorted[1].diff - sorted[0].diff > 6,
        exportedIsUprightLandscape: exportGrid.dims[0] > exportGrid.dims[1],
    };
    window.__r86export = out;
    return JSON.stringify(out, null, 1);
})()
