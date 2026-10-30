// R86 export rotation census: three clips, one bitstream, three declared angles, each exported
// single-camera at its own displayed aspect (so no letterbox enters the comparison), then each
// output's thumbnail compared against its source's. The pattern of winners says whether the GL
// turn lands, is dropped, or is applied on top of a decoder that already turned the frame.
(async () => {
    const DIR = '/storage/emulated/0/TeslaCam/SavedClips/2026-10-17_11-30-00';
    const TAKE = 3000000;
    const N = 12;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const jobs = [
        { camera: 'front', file: 'r86-rot90.mp4', declared: 90, w: 1280, h: 576 },
        { camera: 'back', file: 'r86-rot270.mp4', declared: 270, w: 1280, h: 576 },
        { camera: 'right_pillar', file: 'r86-rot180.mp4', declared: 180, w: 1280, h: 576 },
    ];
    const out = { runs: [] };

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r86e${Math.random().toString(36).slice(2, 7)}`;
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

    for (const [index, job] of jobs.entries()) {
        const source = `${DIR}/2026-10-17_11-30-00-${job.camera}.mp4`;
        const exported = `/storage/emulated/0/Download/r86-out-${job.declared}.mp4`;
        const record = { declared: job.declared, camera: job.camera, canvas: `${job.w}x${job.h}` };
        const request = {
            id: 8600 + index,
            outPath: exported,
            width: job.w,
            height: job.h,
            fps: 30,
            durationUs: TAKE,
            rows: 1,
            cols: 1,
            preferHardware: true,
            cameras: [{
                camera: job.camera,
                cell: 0,
                segments: [{ path: source, clipStartUs: 0, clipEndUs: TAKE, globalStartUs: 0 }],
            }],
        };
        let last = null;
        const handler = (payload) => { if (payload && payload.id === request.id) last = payload.phase; };
        const previousProgress = window.__tdashcamExportProgress;
        window.__tdashcamExportProgress = (payload) => { previousProgress?.(payload); handler(payload); };
        window.TDashcamNative.startExport(JSON.stringify(request));
        for (let i = 0; i < 150 && last !== 'done' && last !== 'error' && last !== 'cancelled'; i += 1) await sleep(1000);
        window.__tdashcamExportProgress = previousProgress;
        record.exportPhase = last;
        if (last !== 'done') { out.runs.push(record); continue; }
        await sleep(1200);

        const sourceGrid = await gridOf(await nativeThumb(source, 1000));
        const exportGrid = await gridOf(await nativeThumb(exported, 1000));
        if (!sourceGrid || !exportGrid) { record.failed = `grid missing s=${!!sourceGrid} e=${!!exportGrid}`; out.runs.push(record); continue; }
        const scores = [0, 90, 180, 270].map((degrees) => ({
            degrees, diff: meanAbs(sourceGrid.cells, turn(exportGrid.cells, degrees)),
        }));
        const sorted = scores.slice().sort((a, b) => a.diff - b.diff);
        record.sourceDims = sourceGrid.dims;
        record.exportDims = exportGrid.dims;
        record.scores = scores;
        record.bestTurn = sorted[0];
        record.runnerUp = sorted[1];
        record.netTurnOfOutput = (360 - sorted[0].degrees) % 360;
        out.runs.push(record);
    }

    out.table = out.runs.map((r) => ({
        declared: r.declared, phase: r.exportPhase, bestTurn: r.bestTurn?.degrees,
        netTurn: r.netTurnOfOutput, diff: r.bestTurn?.diff, runner: r.runnerUp?.diff,
    }));
    window.__r86export3 = out;
    return JSON.stringify(out, null, 1);
})()
