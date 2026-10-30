// R88 acceptance, engine side: are the camera names and the trigger outlines actually in the file,
// and are they in the tile the preview said, and nowhere when the switches are off.
//
// The measure is amber. #ff9f0a is the player's own trigger colour and nothing in the footage is, so
// "the fired tile's picture gained an amber bounding box exactly as wide as the predicted outline"
// is a claim the encode cannot fake, and the control run with both switches off is the same claim
// with the opposite sign.
//
// Two runs, one clip, ranges a tenth of a second apart so each writes its own file. The scene is
// effectively the same frame in both, which is what makes a per-box difference meaningful.
//
// Returns dims, boxes and counts only — no URL, no token, no path beyond the app's own file name.
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
        const id = `r88w${Math.random().toString(36).slice(2, 7)}`;
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
    const boxPx = (img, box) => {
        const x0 = Math.max(0, Math.round(box.x * img.w)), y0 = Math.max(0, Math.round(box.y * img.h));
        const x1 = Math.min(img.w, Math.round((box.x + box.w) * img.w));
        const y1 = Math.min(img.h, Math.round((box.y + box.h) * img.h));
        return { x0, y0, x1, y1 };
    };
    const each = (img, box, fn) => {
        const { x0, y0, x1, y1 } = boxPx(img, box);
        for (let y = y0; y < y1; y += 1) {
            for (let x = x0; x < x1; x += 1) {
                const i = (y * img.w + x) * 4;
                fn(x, y, img.data[i], img.data[i + 1], img.data[i + 2]);
            }
        }
    };
    const isAmber = (r, g, b) => r >= 175 && g >= 100 && g <= 215 && b <= 115 && (r - b) >= 70;
    /** Count and bounding box of the amber pixels inside `box`, reported back as frame fractions. */
    const amber = (img, box) => {
        let n = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        each(img, box, (x, y, r, g, b) => {
            if (!isAmber(r, g, b)) return;
            n += 1;
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
        });
        if (!n) return { n: 0 };
        return { n, x: +(x0 / img.w).toFixed(4), y: +(y0 / img.h).toFixed(4),
            right: +(x1 / img.w).toFixed(4), bottom: +(y1 / img.h).toFixed(4),
            w: +((x1 - x0) / img.w).toFixed(4), h: +((y1 - y0) / img.h).toFixed(4) };
    };
    const white = (img, box) => {
        let n = 0;
        each(img, box, (x, y, r, g, b) => {
            if ((r * 299 + g * 587 + b * 114) / 1000 >= 225) n += 1;
        });
        return n;
    };
    const asFraction = (rect, plan) => ({ x: +(rect.x / plan.width).toFixed(4),
        y: +(rect.y / plan.height).toFixed(4), w: +(rect.w / plan.width).toFixed(4),
        h: +(rect.h / plan.height).toFixed(4) });

    let ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    for (let i = 0; i < 60 && !ev; i += 1) {
        await sleep(2000);
        ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    }
    if (!ev) {
        return JSON.stringify({ fatal: 'SEI event absent',
            ids: (v.eventGroups || []).map((e) => e.eventId).slice(0, 12) });
    }
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);
    if (!(ev.telemetrySamples || []).length) return JSON.stringify({ fatal: 'no telemetry on the fixture' });

    v.peSelection.cameras = ['front', 'back'];
    v.peSelection.size = '720';
    v.peSelection.layout = null;
    const previousProgress = window.__tdashcamExportProgress;
    out.trigger = (() => {
        const hit = v.triggerViewsFor(ev);
        return hit ? { views: hit.views, label: hit.label && (hit.label.zh || hit.label.en) } : null;
    })();

    // The boxes are predicted with both switches forced on, so the control run is measured against
    // the same boxes the next run is — otherwise "nothing appeared" would be trivially true because
    // nothing was asked for anywhere.
    const predict = () => {
        const plan = v.phoneExportPlan();
        if (plan.error) return null;
        const keep = v.peSelection.overlay;
        v.peSelection.overlay = { ...keep, label: true, badge: true };
        const canvas = document.createElement('canvas');
        canvas.width = plan.width; canvas.height = plan.height;
        const ctx = canvas.getContext('2d');
        const rects = v.peRects();
        const perCam = plan.cameras.map((camera, index) => {
            const paint = { x: rects[index].x * plan.width, y: rects[index].y * plan.height,
                w: rects[index].w * plan.width, h: rects[index].h * plan.height };
            const rs = v.pePaintPreviewChrome(ctx, canvas, plan,
                [{ camera: camera.camera, paint }]);
            return { camera: camera.camera, triggered: camera.triggered, paint,
                chip: rs.find((r) => !r.ring) || null, ring: rs.find((r) => r.ring) || null };
        });
        v.peSelection.overlay = keep;
        return { plan, perCam };
    };

    const runExport = async (label, chromePatch, range) => {
        const run = { label, checks: [] };
        v.videoControls.clipStartTime = range[0];
        v.videoControls.clipEndTime = range[1];
        // Watermark off in both runs: every changed pixel then belongs to the chrome layer, and the
        // two questions cannot be answered in one file that burns both.
        v.peSelection.overlay = { ...v.peSelection.overlay,
            stamp: false, hud: false, bar: false, state: false, gps: false, source: false,
            mosaic: false, ...chromePatch };
        v.peCaptionKey = null;
        v.peTelemetryKey = null;
        const guess = predict();
        if (!guess) { run.fatal = v.phoneExportPlan().error; return run; }
        const { plan, perCam } = guess;
        run.predict = { dims: [plan.width, plan.height],
            fired: perCam.filter((c) => c.triggered).map((c) => c.camera),
            chips: perCam.map((c) => c.chip && asFraction(c.chip, plan)),
            rings: perCam.map((c) => c.ring && asFraction(c.ring, plan)) };

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
        if (!finished || !finished.startsWith('done')) {
            run.fatal = `export stopped at ${finished || 'timeout'}`;
            return run;
        }
        await sleep(1200);
        const exp = await loadThumb(OUT, 2000);
        if (!exp) { run.fatal = 'output not readable as a frame'; return run; }
        run.dims = [exp.w, exp.h];
        // Whole-frame amber, plus per-view amber and white inside the boxes the preview predicted.
        run.frameAmber = amber(exp, { x: 0, y: 0, w: 1, h: 1 }).n;
        run.perTile = perCam.map((entry) => {
            const tile = asFraction(entry.paint, plan);
            const chip = entry.chip ? asFraction(entry.chip, plan) : null;
            const ring = entry.ring ? asFraction(entry.ring, plan) : null;
            return { camera: entry.camera, triggered: entry.triggered, tile, chip, ring,
                tileAmber: amber(exp, tile),
                chipAmber: chip ? amber(exp, chip).n : null,
                chipWhite: chip ? white(exp, chip) : null };
        });
        return run;
    };

    // ---- A: both switches off — the control. Nothing amber may appear that B does not also show.
    const a = await runExport('chrome-off', { label: false, badge: false }, [0, 6]);
    out.runs.push(a);
    if (!a.fatal) {
        check(a, '两开关全关：文件里没有任何琥珀角标',
            a.frameAmber <= 8, { frameAmber: a.frameAmber });
        check(a, '两开关全关：每路画面的角落也没有白字簇',
            a.perTile.every((t) => t.chipWhite === null || t.chipWhite <= 40),
            a.perTile.map((t) => ({ cam: t.camera, white: t.chipWhite })));
    }

    // ---- B: both on. Each view's name is in its own tile; each fired view also carries the outline.
    const b = await runExport('chrome-on', { label: true, badge: true }, [0.1, 6.1]);
    out.runs.push(b);
    if (!b.fatal) {
        check(b, '开关全开：文件里出现了琥珀像素', b.frameAmber > 8, { frameAmber: b.frameAmber });
        // Compared against run A box by box. The two files hold the same seconds 0.1s apart, so a
        // difference inside a box is the mark and not the scene — which is the only way a 15px-wide
        // 「后」 in a 640px thumbnail can be told apart from whatever bright pixels it already had.
        const before = new Map((a.perTile || []).map((t) => [t.camera, t]));
        b.perTile.forEach((tile) => {
            const was = before.get(tile.camera) || {};
            const gainedWhite = (tile.chipWhite || 0) - (was.chipWhite || 0);
            const gainedAmber = (tile.chipAmber || 0) - (was.chipAmber || 0);
            check(b, `${tile.camera} 的名字烧进了它自己那路画面`,
                gainedWhite >= 3 || gainedAmber >= 6,
                { gainedWhite, gainedAmber, white: tile.chipWhite, amber: tile.chipAmber,
                    controlWhite: was.chipWhite });
            if (tile.triggered) {
                // The outline goes all the way round the picture, so its amber bbox is the picture.
                const got = tile.tileAmber;
                const want = tile.ring;
                check(b, `${tile.camera} 触发角标圈住的正是预览预测的那块画面`,
                    got.n >= 40 && want
                    && Math.abs(got.x - want.x) < 0.035 && Math.abs(got.y - want.y) < 0.035
                    && Math.abs(got.right - (want.x + want.w)) < 0.035
                    && Math.abs(got.bottom - (want.y + want.h)) < 0.035,
                    { want, got });
            } else {
                check(b, `${tile.camera} 没触发，就不该有琥珀描边`,
                    tile.tileAmber.n <= 8, { amber: tile.tileAmber.n });
            }
        });
    }

    // ---- C: one view, both switches on. The complaint included 「单路也要有开关」, so the single-view
    // file has to carry the name and the outline too — with the tile being the whole frame.
    v.peSelection.cameras = ['front'];
    const c = await runExport('single-chrome-on', { label: true, badge: true }, [0.2, 6.2]);
    out.runs.push(c);
    if (!c.fatal) {
        const tile = (c.perTile || [])[0] || {};
        check(c, '单路导出也烧进相机标签与触发角标',
            (tile.chipAmber || 0) - ((a.perTile || [])[0] ? (a.perTile[0].chipAmber || 0) : 0) >= 6
            && tile.tileAmber.n >= 40,
            { chipAmber: tile.chipAmber, tileAmber: tile.tileAmber.n, ring: tile.ring });
        // A single 1.5437 view in a 1104x720 frame is letterboxed, so the outline has to sit on the
        // picture rather than on the cell — the R83 lesson, this time in the file.
        if (tile.ring) {
            const got = tile.tileAmber;
            check(c, '单路的描边圈的是画面而不是格子（黑边不被圈）',
                Math.abs(got.y - tile.ring.y) < 0.035
                && Math.abs(got.bottom - (tile.ring.y + tile.ring.h)) < 0.035,
                { ring: tile.ring, got });
        }
    }
    v.peSelection.cameras = ['front', 'back'];

    const names = out.runs.map((r) => r.out).filter(Boolean);
    const distinct = new Set(names).size === names.length;
    out.fail += distinct ? 0 : 1;
    out.cross = [{ name: 'each run wrote its own file', pass: distinct, detail: names }];

    window.__tdashcamExportProgress = previousProgress;
    out.verdict = out.fail === 0 ? 'PASS' : `${out.fail} FAILED`;
    return JSON.stringify(out, null, 1);
})()
