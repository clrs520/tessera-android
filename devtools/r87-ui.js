// R87 watermark acceptance, page side. Everything here is decided by the same functions the export
// request is built from, so a pass means the sheet and the file cannot disagree about the watermark
// — the two ways it could silently differ are a caption list built from a stale cache and a preview
// that invents its own geometry.
//
// Deliberately does NOT read any URL or token: the loopback stream token is a whole-file read
// capability and this file's output goes into a doc.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { fatal: null, checks: [], fail: 0 };
    const check = (name, pass, detail) => {
        out.checks.push({ name, pass: !!pass, detail });
        if (!pass) out.fail += 1;
    };
    const KEPT = localStorage.getItem('tdashcam.exportOverlay');

    // A canvas of the *plan's* dims, so the preview arithmetic runs at exactly the size the engine
    // will paint into. `drawPhoneExportPreview` needs decoded frames; this measures the stamp alone.
    const stage = (w, h) => {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        return { canvas, ctx: canvas.getContext('2d') };
    };
    const stampRect = (overlay, painted) => {
        v.peSelection.overlay = { ...v.peSelection.overlay, ...overlay };
        v.peCaptionKey = null;
        const plan = v.phoneExportPlan();
        const { canvas, ctx } = stage(plan.width, plan.height);
        // R91: with the corner's own camera name on, 左上 starts below it. The preview and the file
        // both do this, so measuring the stamp without it would test an anchor the user cannot get.
        return v.pePaintPreviewWatermark(ctx, canvas, painted || null, 0.25,
            v.peChromeTopClear(plan));
    };

    // ---- the SEI-bearing fixture, loaded the way the UI loads it
    const ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_09-00-00'));
    if (!ev) {
        return JSON.stringify({ fatal: 'SEI event absent', ids: (v.eventGroups || []).map((e) => e.eventId).slice(0, 12) });
    }
    await v.playEvent(ev.eventId);
    if (!(ev.telemetrySamples || []).length && typeof v.loadSpeedGraphForEvent === 'function') {
        await v.loadSpeedGraphForEvent(ev);
    }
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);
    const samples = (ev.telemetrySamples || []).length;
    check('fixture carries telemetry', samples > 0, { samples });

    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = 6;
    v.peSelection.cameras = ['front'];
    v.peCaptionKey = null;
    v.peTelemetryKey = null;

    // ---- 1. defaults, read straight from the store-empty path
    localStorage.removeItem('tdashcam.exportOverlay');
    const d = v.readExportOverlay();
    check('defaults tc/stroke/1/bar-on/hud-on/stamp-on/gps-off/source-off',
        d.place === 'tc' && d.bg === 'stroke' && d.scale === 1 && d.bar === true
        && d.hud === true && d.stamp === true && d.state === true
        && d.gps === false && d.source === false, d);

    // ---- 2. the caption series carries the fields by name, and only what the switches ask for
    v.peSelection.overlay = { ...d };
    v.peCaptionKey = null;
    const onAll = v.phoneExportCaptions();
    check('default series has clk+spd+st, no gps/src',
        onAll.length > 0 && onAll.every((c) => c.clk && c.spd && c.st && !c.gps && !c.src),
        onAll.slice(0, 2));
    v.peSelection.overlay = { ...d, gps: true, source: true };
    v.peCaptionKey = null;
    const withGps = v.phoneExportCaptions();
    check('gps switch adds gps and heading', withGps.every((c) => /N\d+\.\d{6}/.test(c.gps) && /E\d+\.\d{6}/.test(c.gps) && /航向|heading/.test(c.gps)),
        { gps: withGps[2] && withGps[2].gps });
    check('source switch adds the tail', withGps.every((c) => /Tessera/.test(c.src || '')), { src: withGps[2] && withGps[2].src });

    // A caption list built while the samples were still missing must not be cached as the truth.
    v.peCaptionKey = null;
    v.peTelemetryKey = null;
    const pts = v.phoneExportTelemetry(ev);
    check('speed is a bare number, unit added downstream',
        pts.length > 0 && /^\d+\.\d$/.test(v.phoneExportSpeedAt(pts, pts[0].at)),
        { first: pts[0], speed: v.phoneExportSpeedAt(pts, pts[0].at) });
    check('bar is a 0..1 fraction', withGps.every((c) => c.bar === undefined || (c.bar >= 0 && c.bar <= 1)),
        { bars: withGps.map((c) => c.bar).slice(0, 6) });

    // ---- 3. no telemetry at all => `--`, never a plausible 0
    const emptyPts = [];
    check('no sample reads as unknown', v.phoneExportSpeedAt(emptyPts, 3) === '--'
        && v.phoneExportGpsAt(emptyPts, 3) === '--', {
        spd: v.phoneExportSpeedAt(emptyPts, 3), gps: v.phoneExportGpsAt(emptyPts, 3) });

    // ---- 4. the anchors land where they say, and the block stays inside the frame
    const plan = v.phoneExportPlan();
    const W = plan.width, H = plan.height;
    const places = {
        tl: (r) => r.x < W * 0.25 && r.y < H * 0.25,
        tc: (r) => Math.abs((r.x + r.w / 2) - W / 2) < W * 0.02 && r.y < H * 0.25,
        tr: (r) => r.x + r.w > W * 0.75 && r.y < H * 0.25,
        bl: (r) => r.x < W * 0.25 && r.y + r.h > H * 0.75,
        bc: (r) => Math.abs((r.x + r.w / 2) - W / 2) < W * 0.02 && r.y + r.h > H * 0.75,
        br: (r) => r.x + r.w > W * 0.75 && r.y + r.h > H * 0.75,
    };
    const rects = {};
    for (const place of ['tl', 'tc', 'tr', 'bl', 'bc', 'br']) {
        const r = stampRect({ place, gps: false, source: true }, null);
        rects[place] = r && { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) };
        check(`anchor ${place} lands in its corner`, r && places[place](r), rects[place]);
        check(`anchor ${place} stays inside the frame`,
            r && r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H, rects[place]);
    }

    // R91: the corner the 左上 stamp wants is the corner the camera name already occupies — the
    // report was 「会和相机标签的位置稍微冲突」. Measured as the two rects, not as a flag: the stamp
    // has to start below the chip, and with the name off it must go back to its own margin rather
    // than leaving a gap nobody asked for.
    const chipRectsAt = (label) => {
        v.peSelection.overlay = { ...v.peSelection.overlay, label: label, badge: false };
        const p = v.phoneExportPlan();
        const { canvas, ctx } = stage(p.width, p.height);
        const rectsOut = v.peRects().map((box, index) => ({ camera: v.peSelection.cameras[index],
            paint: { x: box.x * p.width, y: box.y * p.height, w: box.w * p.width, h: box.h * p.height } }));
        return { plan: p, chips: v.pePaintPreviewChrome(ctx, canvas, p, rectsOut) };
    };
    const withLabel = chipRectsAt(true);
    const corner = withLabel.chips.filter((r) => r.x < withLabel.plan.width * 0.05
        && r.y < withLabel.plan.height * 0.05)[0];
    const tlRect = stampRect({ place: 'tl', gps: false, source: true }, null);
    check('左上 从相机标签下面开始，两者不再叠在一起',
        !!corner && !!tlRect && tlRect.y >= corner.y + corner.h - 1,
        { chipBottom: Math.round(corner.y + corner.h), stampTop: Math.round(tlRect.y),
            clear: v.peChromeTopClear(withLabel.plan).toFixed(4) });
    v.peSelection.overlay = { ...v.peSelection.overlay, label: false };
    const clearWithoutLabel = v.peChromeTopClear(v.phoneExportPlan());
    const tlNoLabel = stampRect({ place: 'tl' }, null);
    check('关掉相机标签后左上回到自己的边距（不多让一段）',
        clearWithoutLabel === 0 && tlNoLabel && tlNoLabel.y <= plan.height * 0.025,
        { clear: clearWithoutLabel, stampTop: tlNoLabel && Math.round(tlNoLabel.y) });
    v.peSelection.overlay = { ...v.peSelection.overlay, label: true };
    // The other three anchors share nothing with a chip that lives at the left, so they must not move.
    const untouched = {};
    for (const place of ['tc', 'tr', 'br']) untouched[place] = stampRect({ place }, null).y;
    check('只有左上让位，其余锚点一动不动',
        Math.abs(untouched.tc - plan.height * 0.02) < 2 && Math.abs(untouched.tr - plan.height * 0.02) < 2,
        { tc: Math.round(untouched.tc), tr: Math.round(untouched.tr), br: Math.round(untouched.br) });

    // `auto` has to sit in a letterbox band, and only when there is one.
    const band = { top: 0, bottom: H * 0.5625 };       // a portrait view in a wide frame: band below
    const autoLow = stampRect({ place: 'auto' }, band);
    check('auto drops into the free bottom band',
        autoLow && autoLow.y >= band.bottom - 1 && autoLow.y + autoLow.h <= H,
        { paintedBottom: Math.round(band.bottom), rect: autoLow && { y: Math.round(autoLow.y), b: Math.round(autoLow.y + autoLow.h) } });
    const bandTop = { top: H * 0.4375, bottom: H };    // band above the picture
    const autoHigh = stampRect({ place: 'auto' }, bandTop);
    check('auto prefers a free top band',
        autoHigh && autoHigh.y <= bandTop.top && autoHigh.y >= 0,
        { rect: autoHigh && { y: Math.round(autoHigh.y), b: Math.round(autoHigh.y + autoHigh.h) } });
    const autoNone = stampRect({ place: 'auto' }, { top: 0, bottom: H });
    check('auto with no band falls back to the top', autoNone && autoNone.y < H * 0.05, autoNone);

    // ---- 5. size is monotonic and the default really is under a tenth of the picture
    const areas = {};
    for (const scale of [WM_SCALE.min, 1, WM_SCALE.max]) {
        const r = stampRect({ place: 'tc', scale, source: true }, null);
        areas[scale] = r && +((r.w * r.h) / (W * H) * 100).toFixed(2);
    }
    check('area grows with the slider',
        areas[WM_SCALE.min] < areas[1] && areas[1] < areas[WM_SCALE.max], areas);
    check('default watermark costs under 3% of the frame',
        areas[1] !== undefined && areas[1] < 3, { area: areas[1], dims: [W, H] });

    // ---- 6. locked columns: the block width must not move when the speed changes digits. Stubbed at
    // the caption seam because nothing else in the page decides what the engine is sent.
    const realCaptions = v.phoneExportCaptions.bind(v);
    const widths = [];
    try {
        for (const spd of ['9.4', '104.7', '88.8']) {
            v.phoneExportCaptions = () => [{ us: 0, clk: '14:23:05', spd, bar: 0.4, st: 'D档 人工驾驶', src: '' }];
            const { canvas, ctx } = stage(W, H);
            const r = v.pePaintPreviewWatermark(ctx, canvas, null);
            widths.push({ spd, w: r && Math.round(r.w) });
        }
    } finally {
        v.phoneExportCaptions = realCaptions;
        v.peCaptionKey = null;
    }
    check('block width is constant across digit counts',
        widths.every((x) => x.w === widths[0].w), widths);

    // ---- 7. the three backgrounds all paint, and none of them moves the block
    const bgRects = {};
    for (const bg of WM_BGS) {
        const r = stampRect({ place: 'tc', bg }, null);
        bgRects[bg] = r && { w: Math.round(r.w), h: Math.round(r.h) };
        check(`bg ${bg} paints`, !!r, bgRects[bg]);
    }
    check('background choice does not move the block',
        bgRects.stroke && bgRects.plate && bgRects.stroke.w === bgRects.plate.w
        && bgRects.stroke.h === bgRects.plate.h, bgRects);

    // ---- 8. the style row collapses when nothing is burned. `display`, because that is what the
    // renderer sets — `hidden` would read false no matter what the row did.
    const collapsed = () => v.peDom.wmStyle
        && getComputedStyle(v.peDom.wmStyle).display === 'none';
    v.peSelection.overlay = { ...d, stamp: false, hud: false, gps: false, source: false, state: false };
    v.renderPhoneWatermarkStyle();
    const hidden = collapsed();
    v.peSelection.overlay = { ...d };
    v.renderPhoneWatermarkStyle();
    const shown = !collapsed();
    check('style row follows the content switches', hidden && shown, { hidden, shown });

    // ---- 9. the panel still reaches 开始导出 at its tallest: every content chip on, the mosaic
    // editor open, and the style row showing. This is the row of failures R23-3/R33-3 each paid for.
    if (typeof v.showPhoneExportModal === 'function') {
        v.peSelection.overlay = { ...d, stamp: true, hud: true, gps: true, source: true, state: true, bar: true, mosaic: true };
        await v.showPhoneExportModal();
        await sleep(400);
        const start = document.getElementById('peStartBtn');
        const sheet = document.getElementById('phoneExportModal');
        const vis = (el) => {
            const b = el.getBoundingClientRect();
            return b.width > 0 && b.height > 0 && b.top >= 0 && b.bottom <= (window.innerHeight || 0) + 1;
        };
        check('开始导出 reachable with every watermark chip on',
            start && vis(start), start && (() => {
                const b = start.getBoundingClientRect();
                return { top: Math.round(b.top), bottom: Math.round(b.bottom), viewport: window.innerHeight, scrollH: sheet && sheet.scrollHeight, clientH: sheet && sheet.clientHeight };
            })());

        // ---- 10. R87: one view gets the preview too. R90 moved that preview out of the 画面 pane and
        // into the dock pinned under the scroller, so what one view loses is the *editor card* — the
        // guarantee itself is now stronger: the frame is on screen without scrolling at all.
        v.peSelection.cameras = ['front'];
        v.renderPhoneExportPanel();
        await sleep(300);
        const editor = document.getElementById('peCanvas');
        const group = editor && editor.closest('.pe-group');
        const previewBtn = document.getElementById('pePreviewBtn');
        const dock = document.getElementById('pePreviewDock');
        const dockLabel = dock && dock.querySelector('.pe-label');
        const shown = (el) => el && getComputedStyle(el).display !== 'none'
            && el.getBoundingClientRect().width > 0;
        check('single view hides the editor card', !shown(group), group && {
            display: getComputedStyle(group).display, w: Math.round(group.getBoundingClientRect().width) });
        check('single view hides the drag editor', !shown(editor));
        check('single view still gets the pinned preview', shown(dock)
            && !!stampRect({ place: 'tc', gps: false, source: true }, null),
            // This probe never opens the page, so the dock is legitimately collapsed to its head row
            // here; what R87 promised is that a one-view export still gets a stamp painted at all.
            // Whether the frame is *shown* is r88-ui's business, measured on the open page.
            dock && { h: Math.round(dock.getBoundingClientRect().height),
                on: v.pePreviewOn, stampPaintsForOne: true });
        check('the dock is labelled 预览/Preview', dockLabel
            && /预览|Preview/.test(dockLabel.textContent), dockLabel && dockLabel.textContent);
        // The sheet scrolls; a control below the fold is reachable, not missing. Scroll it into view
        // the way a thumb would, then judge.
        const body = document.querySelector('#phoneExportModal .pe-body');
        if (body) body.scrollTop = body.scrollHeight;
        await sleep(300);
        check('预览帧 button reachable for one view', shown(previewBtn) && vis(previewBtn),
            previewBtn && (() => { const b = previewBtn.getBoundingClientRect();
                return { top: Math.round(b.top), bottom: Math.round(b.bottom), viewport: window.innerHeight }; })());
        // Set, never toggle: this probe runs against a page that may already be in the state, and a
        // toggle on a second run turns the very thing it is about to assert off.
        if (!v.pePreviewOn) v.togglePhoneExportPreview();
        for (let i = 0; i < 24; i += 1) {
            await sleep(500);
            const cap = (document.getElementById('pePreviewCap') || {}).textContent || '';
            if (!/取帧|Fetching|busy/i.test(cap)) break;
        }
        check('preview paints for one view',
            v.pePreviewOn && shown(document.getElementById('pePreviewCanvas')),
            { on: v.pePreviewOn, cap: (document.getElementById('pePreviewCap') || {}).textContent });
    }

    if (KEPT === null) localStorage.removeItem('tdashcam.exportOverlay');
    else localStorage.setItem('tdashcam.exportOverlay', KEPT);
    v.peCaptionKey = null;
    v.peTelemetryKey = null;
    out.verdict = out.fail === 0 ? 'PASS' : `${out.fail} FAILED`;
    out.dims = [W, H];
    return JSON.stringify(out, null, 1);
})()
