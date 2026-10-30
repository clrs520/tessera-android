// R91 engine-side measurement: the user's real-device exports show the stamp cut off at the right
// edge for 右上/右下, and colliding with the burned camera label at 左上. The page can quote a rect;
// this asks the *file* where the ink actually landed.
//
// Method: export the same plan twice — once with every watermark row on, once with them all off —
// then diff the two decoded frames pixel by pixel. A pixel that is bright in the ON frame and dark in
// the OFF frame is ink, and the bounding box of all ink is the stamp's real footprint. Its right and
// bottom gaps to the frame edge are the whole question: a stamp that is placed correctly cannot touch
// the edge it was anchored against, because the layout reserves a 2% margin plus its own padding.
//
// Returns dims, boxes and counts only — no URL, no token, no path beyond the app's own file name.
(async () => {
    const v = viewer;
    const THUMB_W = 960;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { runs: [], fail: 0 };

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r91w${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, THUMB_W);
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
    // Ink = clearly brighter than the same pixel in the control frame. The letters are white with a
    // dark stroke, so the delta is enormous against any scene; 45/170 keeps a headlight out of it.
    const inkBox = (on, off) => {
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
        const columns = new Int32Array(on.w);
        for (let y = 0; y < on.h; y += 1) {
            for (let x = 0; x < on.w; x += 1) {
                const a = luma(on, x, y);
                if (a < 170 || a - luma(off, x, y) < 45) continue;
                n += 1;
                columns[x] += 1;
                if (x < x0) x0 = x;
                if (y < y0) y0 = y;
                if (x > x1) x1 = x;
                if (y > y1) y1 = y;
            }
        }
        return n ? { n, x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1,
            // The rightmost five columns that carry any ink. A stamp clipped by the bitmap ends
            // exactly where the bitmap ends, so this is the shape of the cut.
            tail: Array.from(columns.slice(Math.max(0, on.w - 12))).join(' ') } : { n: 0 };
    };

    let ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    for (let i = 0; i < 60 && !ev; i += 1) {
        await sleep(2000);
        ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    }
    if (!ev) return JSON.stringify({ fatal: 'SEI event absent',
        ids: (v.eventGroups || []).map((e) => e.eventId).slice(0, 12) });
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);
    if (!(ev.telemetrySamples || []).length) return JSON.stringify({ fatal: 'no telemetry on the fixture' });

    const previousProgress = window.__tdashcamExportProgress;
    const runExport = async (patch) => {
        v.peSelection.overlay = { ...v.readExportOverlay(), mosaic: false, stamp: true, hud: true,
            state: true, bar: true, gps: true, source: true, bg: 'stroke', scale: 1, ...patch };
        v.peCaptionKey = null;
        v.peTelemetryKey = null;
        const plan = v.phoneExportPlan();
        if (plan.error) return { fatal: plan.error };
        const seen = [];
        window.__tdashcamExportProgress = (payload) => {
            if (previousProgress) previousProgress(payload);
            if (payload) {
                seen.push(`${payload.phase}:${payload.percent ?? ''}`);
                if (payload.message) out.lastMessage = payload.message;
            }
        };
        await v.startPhoneExport();
        const path = v.peJob && v.peJob.outPath;
        if (!path) return { fatal: 'no outPath', plan };
        let finished = null;
        for (let i = 0; i < 240; i += 1) {
            await sleep(1000);
            const last = seen.filter((s) => /^(done|error|cancelled)/.test(s)).pop();
            if (last) { finished = last; break; }
        }
        if (!finished || !finished.startsWith('done')) {
            return { fatal: `export stopped at ${finished || 'timeout'}`, plan,
                engineMessage: out.lastMessage };
        }
        await sleep(1200);
        return { path, name: path.split('/').pop(), plan };
    };

    // Each pair gets its own tenth of a second so the two muxers never share a file name.
    // The grid cases also cover the two sides of `MAX_STRIP_WIDTH`: 4 views stays under it
    // (upscale = 1), 6 views goes over it (upscale > 1) — the only path where the bitmap is a
    // downscaled stand-in for the frame, and the one a real phone hits at 1080p.
    const CASES = [
        { label: 'single-tr', cameras: ['front'], place: 'tr', size: '720', range: [0, 1.6] },
        { label: 'grid4-br', cameras: ['front', 'back', 'left', 'right'], place: 'br',
            size: '480', range: [1.7, 3.3] },
        // The collision case: the stamp and the burned camera name both want the file's top-left.
        { label: 'single-tl', cameras: ['front'], place: 'tl', size: '720', range: [3.4, 5.0] },
    ];
    for (const c of CASES) {
        const run = { label: c.label, place: c.place };
        v.peSelection.cameras = c.cameras.slice();
        v.peSelection.size = c.size;
        v.peSelection.layout = null;
        v.videoControls.clipStartTime = c.range[0];
        v.videoControls.clipEndTime = c.range[1];
        const on = await runExport({ place: c.place });
        if (on.fatal) { run.fatal = on.fatal; out.runs.push(run); continue; }
        // The control is the same plan with every row off: same encoder, same letterbox, same labels.
        v.videoControls.clipStartTime = c.range[0] + 0.1;
        v.videoControls.clipEndTime = c.range[1] + 0.1;
        const off = await runExport({ place: c.place, stamp: false, hud: false, state: false,
            bar: false, gps: false, source: false });
        if (off.fatal) { run.fatal = `control: ${off.fatal}`; out.runs.push(run); continue; }
        run.dims = [on.plan.width, on.plan.height];
        run.out = on.name;
        run.controlOut = off.name;
        // Predicted while the ON overlay is still the selection: the control run has just switched
        // every row off, and asking the painter afterwards gets `no watermark` for a stamp that was
        // unmistakably in the file.
        const scratch = document.createElement('canvas');
        scratch.width = on.plan.width; scratch.height = on.plan.height;
        const rect = v.pePaintPreviewWatermark(scratch.getContext('2d'), scratch, null, 0.6,
            v.peChromeTopClear(on.plan));
        run.predicted = rect ? {
            x: +(rect.x / on.plan.width).toFixed(4), y: +(rect.y / on.plan.height).toFixed(4),
            w: +(rect.w / on.plan.width).toFixed(4), h: +(rect.h / on.plan.height).toFixed(4),
            right: +((rect.x + rect.w) / on.plan.width).toFixed(4),
            px: [Math.round(rect.w), Math.round(rect.h)],
        } : 'preview painted no watermark';

        const at = 600;
        const [frameOn, frameOff] = [await loadFrame(on.path, at), await loadFrame(off.path, at)];
        if (!frameOn || !frameOff) { run.fatal = `thumb missing ${!!frameOn}/${!!frameOff}`; out.runs.push(run); continue; }
        run.thumb = [frameOn.w, frameOn.h];
        const ink = inkBox(frameOn, frameOff);
        if (!ink.n) { run.fatal = 'no ink found in the ON frame'; out.runs.push(run); continue; }
        // Fractions of the frame, so the numbers mean the same thing at any thumbnail scale.
        const f = (n, d) => +(n / d).toFixed(4);
        run.ink = { n: ink.n,
            left: f(ink.x0, frameOn.w), right: f(ink.x1 + 1, frameOn.w),
            top: f(ink.y0, frameOn.h), bottom: f(ink.y1 + 1, frameOn.h),
            w: f(ink.w, frameOn.w), h: f(ink.h, frameOn.h) };
        run.gaps = { rightPx: frameOn.w - 1 - ink.x1, bottomPx: frameOn.h - 1 - ink.y1,
            leftPx: ink.x0, topPx: ink.y0 };
        if (rect && ink.n) {
            // The whole question in one number: does the ink end where the preview said, or at the
            // edge of the bitmap it was drawn into?
            run.cut = {
                inkRightMinusPredictedRight: +((f(ink.x1 + 1, frameOn.w)
                    - (rect.x + rect.w) / on.plan.width)).toFixed(4),
                gapToFrameEdgePx: frameOn.w - 1 - ink.x1,
                inkTopMinusPredictedTop: +((f(ink.y0, frameOn.h) - rect.y / on.plan.height)).toFixed(4),
            };
        }
        out.runs.push(run);
    }
    // The engine's own report of the block it built, straight from the last export's log line, is
    // pulled by the shell (logcat) — this file only states what the pixels say.
    return JSON.stringify(out);
})()
