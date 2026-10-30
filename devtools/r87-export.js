// R87 watermark acceptance, engine side. The page can quote a rect all day; this asks the file what
// actually got burned. The measure is the change in a *region* between the exported frame and the
// same second of the source clip: a watermark is a handful of very bright pixels laid over whatever
// the camera saw, so a per-cell threshold at thumbnail scale throws most of them away, while "the
// block gained bright pixels and the rest of the frame did not" is a claim the encode cannot fake.
//
// Two runs, because one only proves the fixed anchors: A is the default top-centre stamp, B is `auto`
// with the view squeezed into a middle strip, which is the letterbox band the anchor is supposed to
// find on its own from the cells it painted.
//
// It returns dims, regions and percentages only — no URL, no token, no path outside the app's own
// output name.
(async () => {
    const v = viewer;
    const THUMB_W = 640;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { runs: [], fatal: null, fail: 0 };
    const check = (run, name, pass, detail) => {
        run.checks.push({ name, pass: !!pass, detail });
        if (!pass) out.fail += 1;
    };

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r87w${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, THUMB_W);
    });
    const loadThumb = async (path, at) => {
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
    // Luma, counted over a box given in *frame* fractions, which is how both sides of the comparison
    // describe the same place regardless of the thumbnail's own size.
    const region = (img, box) => {
        const x0 = Math.max(0, Math.round(box.x * img.w)), y0 = Math.max(0, Math.round(box.y * img.h));
        const x1 = Math.min(img.w, Math.round((box.x + box.w) * img.w));
        const y1 = Math.min(img.h, Math.round((box.y + box.h) * img.h));
        let max = 0, bright = 0, sum = 0, n = 0;
        for (let y = y0; y < y1; y += 1) {
            for (let x = x0; x < x1; x += 1) {
                const i = (y * img.w + x) * 4;
                const luma = (img.data[i] * 299 + img.data[i + 1] * 587 + img.data[i + 2] * 114) / 1000;
                if (luma > max) max = luma;
                if (luma >= 225) bright += 1;
                sum += luma; n += 1;
            }
        }
        return { max: Math.round(max), bright, mean: Math.round(sum / Math.max(1, n)), px: n };
    };
    const diff = (a, b) => ({ max: b.max - a.max, bright: b.bright - a.bright, mean: b.mean - a.mean });
    const asFractions = (rect, plan) => ({ x: rect.x / plan.width, y: rect.y / plan.height,
        w: rect.w / plan.width, h: rect.h / plan.height });

    // The folder is restored asynchronously after a cold start, and an event list that has not
    // landed yet is not a missing fixture. Wait for it before calling the precondition a failure.
    let ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_09-00-00'));
    for (let i = 0; i < 60 && !ev; i += 1) {
        await sleep(2000);
        ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_09-00-00'));
    }
    if (!ev) return JSON.stringify({ fatal: 'SEI event absent', ids: (v.eventGroups || []).map((e) => e.eventId).slice(0, 12) });
    await v.playEvent(ev.eventId);
    if (!(ev.telemetrySamples || []).length && typeof v.loadSpeedGraphForEvent === 'function') {
        await v.loadSpeedGraphForEvent(ev);
    }
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);
    if (!(ev.telemetrySamples || []).length) return JSON.stringify({ fatal: 'no telemetry on the fixture' });

    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = 6;
    v.peSelection.cameras = ['front'];
    v.peSelection.size = '720';
    // `source` on this fixture is 2896x1872 and the AVD has no H.264 encoder that will take it — the
    // engine says so in as many words. 720 is what a phone actually encodes anyway.
    const stored = JSON.parse(localStorage.getItem('tdashcam.exportOverlay') || '{}');
    const previousProgress = window.__tdashcamExportProgress;

    const runExport = async (label, overlayPatch, layout, range) => {
        const run = { label, checks: [] };
        v.peSelection.layout = layout;
        // Each run gets its own clip range, because the output name is built from the range and two
        // runs sharing one name means the second muxer eats the file the first is being measured from.
        // A tenth of a second costs nothing and buys a separate path.
        v.videoControls.clipStartTime = range[0];
        v.videoControls.clipEndTime = range[1];
        v.peSelection.overlay = { ...v.peSelection.overlay, ...stored, mosaic: false, stamp: true,
            hud: true, state: true, bar: true, gps: true, source: true, place: 'tc', bg: 'stroke',
            scale: 1, ...overlayPatch };
        v.peCaptionKey = null;
        v.peTelemetryKey = null;
        const plan = v.phoneExportPlan();
        if (plan.error) { run.fatal = plan.error; return run; }
        const SOURCE = plan.cameras[0].segments[0].path;

        // The same arithmetic the sheet paints, on a canvas of the size the engine will encode.
        const canvas = document.createElement('canvas');
        canvas.width = plan.width; canvas.height = plan.height;
        const painted = layout ? { top: layout.front.y * plan.height,
            bottom: (layout.front.y + layout.front.h) * plan.height } : null;
        const rect = v.pePaintPreviewWatermark(canvas.getContext('2d'), canvas, painted);
        if (!rect) { run.fatal = 'preview painted no watermark'; return run; }
        run.predict = { dims: [plan.width, plan.height], place: v.peSelection.overlay.place,
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h) },
            area: +((rect.w * rect.h) / (plan.width * plan.height) * 100).toFixed(2) };
        const block = asFractions(run.predict.rect, plan);
        // The control has to be a place that is the *same picture* on both sides. Without a custom
        // layout the frame is the picture, so the far band works; with one, the exported frame carries
        // letterbox the source file does not have, and the only honest control is "the other band of
        // the output is still black" — measured on the output alone.
        const letterbox = !!layout;
        const control = block.y > 0.5
            ? { x: 0, y: 0, w: 1, h: Math.max(0.15, block.y - 0.04) }
            : { x: 0, y: Math.min(0.99, block.y + block.h + 0.04), w: 1, h: 1 - Math.min(0.99, block.y + block.h + 0.04) };

        const seen = [];
        window.__tdashcamExportProgress = (payload) => {
            if (previousProgress) previousProgress(payload);
            if (payload) {
                seen.push(`${payload.phase}:${payload.percent ?? ''}`);
                if (payload.message) run.engineMessage = payload.message;
            }
        };
        await v.startPhoneExport();
        const OUT = v.peJob && v.peJob.outPath;
        if (!OUT) { run.fatal = 'no outPath: the export never started'; return run; }
        run.out = OUT.split('/').pop();
        let finished = null;
        for (let i = 0; i < 240; i += 1) {
            await sleep(1000);
            const last = seen.filter((s) => /^(done|error|cancelled)/.test(s)).pop();
            if (last) { finished = last; break; }
        }
        if (!finished || !finished.startsWith('done')) { run.fatal = `export stopped at ${finished || 'timeout'}`; return run; }
        await sleep(1200);

        // One second into the *file*, which starts at the clip's own in-point.
        const src = await loadThumb(SOURCE, 1000 + range[0] * 1000);
        const exp = await loadThumb(OUT, 1000);
        if (!src || !exp) { run.fatal = `thumb missing src=${!!src} out=${!!exp}`; return run; }
        const srcBlock = region(src, block);
        const outBlock = region(exp, block);
        const outControl = region(exp, control);
        run.compare = { block, control, srcBlock, outBlock, outControl,
            inBlock: diff(srcBlock, outBlock), inControl: diff(region(src, control), outControl) };
        if (letterbox) {
            // The stamp chose a band the engine knows is black, so every bright pixel in it is ink.
            check(run, 'the band the stamp chose carries burned brightness',
                outBlock.bright >= 6 && outBlock.mean <= 120, outBlock);
            check(run, 'the other band is still black', outControl.bright <= 2, outControl);
        } else {
            check(run, 'the predicted block gained burned-in brightness',
                run.compare.inBlock.bright >= 6 && run.compare.inBlock.max >= 120, run.compare.inBlock);
            check(run, 'the block is lifted on average', run.compare.inBlock.mean >= 4, run.compare.inBlock);
            check(run, 'nothing outside the block was burned',
                Math.abs(run.compare.inControl.mean) <= 3 && run.compare.inControl.bright <= 2,
                run.compare.inControl);
        }
        return run;
    };

    // ---- A: the default top-centre stamp, all six content switches on
    out.runs.push(await runExport('default-tc', {}, null, [0, 6]));

    // ---- B: `auto`, with the view squeezed into a middle strip so the bands are real
    const stripTop = 0.3;
    const b = await runExport('auto-letterbox', { place: 'auto' },
        { front: { x: 0, y: stripTop, w: 1, h: 0.4 } }, [0.1, 6.1]);
    out.runs.push(b);
    if (b.predict) {
        check(b, 'auto parked the stamp above the picture, in the band',
            b.predict.rect.y < b.predict.dims[1] * stripTop,
            { blockTop: Math.round(b.predict.rect.y), stripTopPx: Math.round(b.predict.dims[1] * stripTop) });
    }

    const names = out.runs.map((r) => r.out).filter(Boolean);
    const distinct = new Set(names).size === names.length;
    out.fail += distinct ? 0 : 1;
    out.checks = [{ name: 'each run wrote its own file', pass: distinct, detail: names }];

    window.__tdashcamExportProgress = previousProgress;
    out.verdict = out.fail === 0 ? 'PASS' : `${out.fail} FAILED`;
    return JSON.stringify(out, null, 1);
})()
