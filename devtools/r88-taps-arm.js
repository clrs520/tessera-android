// R89 tap harness, part 1: put the export page in a known state and hand back the device-pixel
// centre of every control the harness will tap. Deliberately reads no URL and no token.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    for (let i = 0; i < 60 && !ev; i += 1) {
        await sleep(2000);
        ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    }
    if (!ev) return JSON.stringify({ fatal: 'SEI event absent' });
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);

    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = 8;
    v.peSelection.size = '720';
    v.peSelection.cameras = ['front', 'back'];
    v.peCaptionKey = null;
    v.peTelemetryKey = null;
    v.hidePhoneExportModal();
    await sleep(400);
    await v.showPhoneExportModal();
    await sleep(400);
    v.closePhoneExportZoom();
    await sleep(400);
    v.setPhoneExportPane('view');
    if (!v.pePreviewOn) v.togglePhoneExportPreview();
    for (let i = 0; i < 80 && /正在取帧|Fetching/.test(v.peDom.previewCap.textContent || ''); i += 1) {
        await sleep(500);
    }
    await sleep(600);

    // A hidden pane reports 0×0, so each group is measured while its own pane is the visible one.
    // The harness's tap order is the pane order below, which is why the points are taken here.
    const dpr = window.devicePixelRatio;
    const BY_PANE = {
        view: {
            chipBack: '#peCameraChips [data-camera="back"]',
            chipBack2: '#peCameraChips [data-camera="back"]',
            size480: '#peSizeChips [data-size="480"]',
            previewBtn: '#pePreviewBtn',
            previewBtn2: '#pePreviewBtn',
            zoomCanvas: '#pePreviewCanvas',
        },
        over: {
            chipLabel: '#peChromeChips [data-overlay="label"]',
            chipBadge: '#peChromeChips [data-overlay="badge"]',
        },
        range: {},
    };
    const SEL = {
        tabOver: '.pe-seg [data-pane="over"]',
        tabRange: '.pe-seg [data-pane="range"]',
        tabView: '.pe-seg [data-pane="view"]',
        zoomClose: '#peZoomClose',
        navBack: '#peCloseBtn',
    };
    const points = {};
    const scrolls = {};
    const missing = [];
    const measure = async (map) => {
        const body = v.peDom.body;
        for (const [name, sel] of Object.entries(map)) {
            const el = document.querySelector(sel);
            if (!el) { missing.push(name); continue; }
            // R90: the pinned preview band took ~300px from the scroller, so two of the 叠加 chips
            // now live below the fold. A real finger scrolls first, and the point it taps is the
            // point the control has *after* that scroll — so the scroll is part of what is measured,
            // not something the harness gets to assume. Only for what lives in the scroller.
            if (body && el.closest('.pe-body')) {
                const b0 = el.getBoundingClientRect();
                const band = body.getBoundingClientRect();
                if (b0.width >= 4 && (b0.bottom > band.bottom || b0.top < band.top)) {
                    el.scrollIntoView({ block: 'center' });
                    await sleep(150);
                }
            }
            const b = el.getBoundingClientRect();
            if (!b || b.width < 4) { missing.push(name); continue; }
            points[name] = Math.round((b.left + b.width / 2) * dpr) + ','
                + Math.round((b.top + b.height / 2) * dpr);
            scrolls[name] = body ? Math.round(body.scrollTop) : 0;
        }
    };
    await measure(SEL);
    for (const pane of ['view', 'over', 'range']) {
        v.setPhoneExportPane(pane);
        await sleep(220);
        await measure(BY_PANE[pane]);
    }
    v.setPhoneExportPane('view');
    await sleep(300);
    // The zoom bar only has a box while the zoom layer is open, so it is measured the same way:
    // open, measure, close. Without this the harness reports NO POINT for 关闭 and silently skips it.
    v.openPhoneExportZoom();
    await sleep(700);
    await measure({ zoomClose: '#peZoomClose' });
    v.closePhoneExportZoom();
    await sleep(500);
    return JSON.stringify({ points, scrolls, missing, dpr, viewport: [innerWidth, innerHeight],
        pane: v.pePane, previewOn: v.pePreviewOn,
        shown: v.peDom.modal.classList.contains('show') });
})()
