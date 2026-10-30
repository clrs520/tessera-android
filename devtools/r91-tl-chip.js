// R91, the case the user actually reported: 左上 watermark vs the burned-in camera name. The earlier
// file probe inherited whatever the chrome switches happened to be, so its frames carried no chip at
// all and proved nothing about the collision. This one turns the chip on, exports a single-front clip
// at 左上, and reads the *file*: the two bright bands stacked in the top-left corner are the chip and
// the stamp, and the question is whether they touch.
// Returns band geometry and the app's own output file name — no URL, no token.
(async () => {
    const v = viewer;
    const THUMB_W = 960;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r91t${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        // The retriever throws on the bridge a beat after an export releases its own — the muxer is
        // still closing. Retrying the same call is enough; the file is fine.
        for (let i = 0; i < 4; i += 1) {
            try { window.TDashcamNative.requestThumb(id, path, millis, THUMB_W); return; }
            catch (e) { if (i === 3) { done = true; resolve(null); } }
        }
    });
    const loadFrame = async (path, at) => {
        const src = await nativeThumb(path, at);
        if (!src) return null;
        return await new Promise((resolve) => {
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
    };
    const luma = (img, x, y) => {
        const i = (y * img.w + x) * 4;
        return (img.data[i] * 299 + img.data[i + 1] * 587 + img.data[i + 2] * 114) / 1000;
    };
    // The fixture scene is black, so every bright pixel in the corner band is one of the two marks.
    const rowInk = (img, xTo) => {
        const rows = [];
        for (let y = 0; y < Math.round(img.h * 0.34); y += 1) {
            let n = 0;
            for (let x = 0; x < xTo; x += 1) if (luma(img, x, y) >= 170) n += 1;
            rows.push(n);
        }
        return rows;
    };
    const bands = (rows) => {
        const out = [];
        let start = -1;
        rows.forEach((n, y) => {
            if (n >= 3 && start < 0) start = y;
            if (n < 3 && start >= 0) { out.push([start, y - 1]); start = -1; }
        });
        if (start >= 0) out.push([start, rows.length - 1]);
        return out;
    };

    let ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    for (let i = 0; i < 60 && !ev; i += 1) {
        await sleep(2000);
        ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    }
    if (!ev) return JSON.stringify({ fatal: 'SEI event absent' });
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);

    const previousProgress = window.__tdashcamExportProgress;
    const seen = [];
    window.__tdashcamExportProgress = (payload) => {
        if (previousProgress) previousProgress(payload);
        if (payload) {
            const line = `${payload.phase} ${payload.message || ''}`;
            if (!seen.length || seen[seen.length - 1] !== line) seen.push(line);
        }
    };

    v.peSelection.cameras = ['front'];
    v.peSelection.size = '720';
    v.peSelection.layout = null;
    v.videoControls.clipStartTime = 0.3;
    v.videoControls.clipEndTime = 1.9;
    v.peSelection.overlay = { ...v.readExportOverlay(), mosaic: false, stamp: true, hud: true,
        state: true, bar: true, gps: false, source: false, bg: 'stroke', scale: 1,
        place: 'tl', label: true, badge: false };
    v.peCaptionKey = null;
    v.peTelemetryKey = null;
    const plan = v.phoneExportPlan();
    if (plan.error) return JSON.stringify({ fatal: plan.error });
    const clear = v.peChromeTopClear(plan);
    await v.startPhoneExport();
    // Read while the job is still live: `peJob` is cleared the moment the muxer reports done.
    const path = v.peJob && v.peJob.outPath;
    if (!path) return JSON.stringify({ fatal: 'no outPath', plan });
    const name = path.split('/').pop();
    let finished = null;
    for (let i = 0; i < 240; i += 1) {
        await sleep(1000);
        const last = seen.filter((s) => /^(done|error|cancelled)/.test(s)).pop();
        if (last) { finished = last; break; }
    }
    window.__tdashcamExportProgress = previousProgress;
    if (!finished || !finished.startsWith('done')) {
        return JSON.stringify({ fatal: `export stopped at ${finished || 'timeout'}`, seen: seen.slice(-4) });
    }
    await sleep(1200);

    const frame = await loadFrame(path, 700);
    if (!frame) return JSON.stringify({ fatal: 'output not readable as a frame', name });
    const rows = rowInk(frame, Math.round(frame.w * 0.46));
    const found = bands(rows);
    const chip = found[0];
    const stamp = found.length > 1 ? found[1] : null;
    return JSON.stringify({
        name, dims: [plan.width, plan.height], thumb: [frame.w, frame.h],
        topClear: Number(clear.toFixed(4)),
        bands: found,
        chip: chip ? { top: chip[0], bottom: chip[1], frac: [chip[0] / frame.h, chip[1] / frame.h] } : null,
        stamp: stamp ? { top: stamp[0], bottom: stamp[1], frac: [stamp[0] / frame.h, stamp[1] / frame.h] } : null,
        gapPx: stamp && chip ? stamp[0] - chip[1] : null,
        inkRows: rows.filter((n) => n >= 3).length,
    });
})()
