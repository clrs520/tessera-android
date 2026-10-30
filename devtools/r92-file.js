// R92 acceptance, file side: the preview can say the unit is tight; only the encoded file says the
// engine agrees. Exports one single-front 720p clip whose speed reading wanders across seconds
// (the fixture runs 15.6 → 77.7 → 41.3 …), then decodes one frame per second *out of the file* and
// measures the gap between the last digit and the unit. Before the fix that gap tracked the reading;
// after it, the digits slide inside their reserved column and the gap is the same number every second.
// Reads no URL, prints no token.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { version: 'r92-file' };

    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = `r92f${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        const finish = (value) => { if (!done) { done = true; resolve(value); } };
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id) finish(typeof dataUrl === 'string' ? dataUrl : null);
        };
        setTimeout(() => finish(null), 25000);
        for (let i = 0; i < 4; i += 1) {
            try { window.TDashcamNative.requestThumb(id, path, millis, 1100); return; }
            catch (e) { if (i === 3) finish(null); }
        }
    });
    const frame = async (path, at) => {
        const src = await nativeThumb(path, at);
        if (!src) return null;
        return await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve({ w: canvas.width, h: canvas.height,
                    data: ctx.getImageData(0, 0, canvas.width, canvas.height).data });
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    };
    const luma = (f, x, y) => {
        const i = (y * f.w + x) * 4;
        return (f.data[i] * 299 + f.data[i + 1] * 587 + f.data[i + 2] * 114) / 1000;
    };
    // The number is the only *tall* ink on the line (the clock is 0.59× and the unit 0.43× its size),
    // so a per-column vertical extent separates them. Grouping by whitespace cannot: the whole point
    // of this round is that the unit now sits close.
    const gapOf = (f) => {
        const top = Math.round(f.h * 0.02), bottom = Math.round(f.h * 0.14);
        const tall = [], any = [], extent = [];
        for (let x = 0; x < f.w; x += 1) {
            let hit = 0, first = -1, last = -1;
            for (let y = top; y < bottom; y += 1) {
                if (luma(f, x, y) >= 150) { hit += 1; if (first < 0) first = y; last = y; }
            }
            any.push(hit);
            extent.push(hit > 0 ? last - first + 1 : 0);
        }
        // Scale-free: the thumb is a downscaled frame, so "tall" is relative to the tallest ink
        // on the line (the number), not to the band. The clock is 0.59x it and the unit 0.43x.
        const maxE = Math.max(...extent);
        extent.forEach((e, x) => { tall[x] = e >= maxE * 0.75; });
        let nL = -1, nR = -1;
        tall.forEach((isTall, x) => { if (!isTall) return; if (nL < 0) nL = x; nR = x; });
        let unitL = -1;
        for (let x = nR + 1; x < f.w; x += 1) if (any[x]) { unitL = x; break; }
        // A right edge that stays put while the left edge moves *is* the fix, so report both.
        return { number: nL >= 0 ? [nL, nR] : null, unitLeft: unitL >= 0 ? unitL : null,
            gap: nL >= 0 && unitL >= 0 ? unitL - nR - 1 : null,
            numberFrac: nL >= 0 ? [+(nL / f.w).toFixed(4), +(nR / f.w).toFixed(4)] : null,
            unitFrac: unitL >= 0 ? +(unitL / f.w).toFixed(4) : null };
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
        if (payload) seen.push(`${payload.phase} ${payload.message || ''}`);
    };
    v.peSelection.cameras = ['front'];
    v.peSelection.size = '720';
    v.peSelection.layout = null;
    v.videoControls.clipStartTime = 0.2;
    v.videoControls.clipEndTime = 5.6;
    v.peSelection.overlay = { ...v.readExportOverlay(), mosaic: false, stamp: true, hud: true,
        state: true, bar: false, gps: false, source: false, bg: 'stroke', scale: 1,
        place: 'tr', label: false, badge: false };
    v.peCaptionKey = null;
    v.peTelemetryKey = null;
    const plan = v.phoneExportPlan();
    if (plan.error) { window.__tdashcamExportProgress = previousProgress;
        return JSON.stringify({ fatal: plan.error }); }
    await v.startPhoneExport();
    const path = v.peJob && v.peJob.outPath;
    if (!path) { window.__tdashcamExportProgress = previousProgress;
        return JSON.stringify({ fatal: 'no outPath' }); }
    out.name = path.split('/').pop();
    let finished = null;
    for (let i = 0; i < 300; i += 1) {
        await sleep(1000);
        const last = seen.filter((s) => /^(done|error|cancelled)/.test(s)).pop();
        if (last) { finished = last; break; }
    }
    window.__tdashcamExportProgress = previousProgress;
    if (!finished || !finished.startsWith('done')) {
        return JSON.stringify({ fatal: `export stopped at ${finished || 'timeout'}`,
            seen: seen.slice(-3) });
    }
    await sleep(1500);

    out.samples = [];
    for (const at of [300, 1300, 2300, 3300, 4300, 5100]) {
        const f = await frame(path, at);
        if (!f) { out.samples.push({ at, fatal: 'no frame' }); continue; }
        out.samples.push({ at, thumb: [f.w, f.h], ...gapOf(f) });
    }
    const ok = out.samples.filter((s) => Number.isFinite(s.gap));
    const gaps = ok.map((s) => s.gap);
    const units = ok.map((s) => s.unitFrac);
    const rights = ok.map((s) => s.numberFrac[1]);
    const lefts = ok.map((s) => s.numberFrac[0]);
    out.summary = {
        seconds: ok.length,
        gapMin: Math.min(...gaps), gapMax: Math.max(...gaps),
        unitFracMin: Math.min(...units), unitFracMax: Math.max(...units),
        rightFracMin: Math.min(...rights), rightFracMax: Math.max(...rights),
        leftFracMin: Math.min(...lefts), leftFracMax: Math.max(...lefts),
    };
    out.verdict = {
        '至少四秒量到（探针没瞎）': ok.length >= 4,
        '文件里数字到单位的间隙逐秒一致（≤ 3px）': ok.length >= 4
            && Math.max(...gaps) - Math.min(...gaps) <= 3,
        '间隙是紧的（≤ 16px @1100 宽）': ok.length >= 4 && Math.max(...gaps) <= 16,
        '数字右沿逐秒钉住（≤ 0.6% 宽，字形不同允许一点）': ok.length >= 4
            && Math.max(...rights) - Math.min(...rights) <= 0.006,
        '数字左沿确实会走（右对齐的签名）': ok.length >= 4
            && Math.max(...lefts) - Math.min(...lefts) > 0.004,
    };
    out.fail = Object.values(out.verdict).filter((x) => !x).length;
    return JSON.stringify(out);
})()
