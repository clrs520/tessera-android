// R88 appearance setup: leave the export *page* open exactly as the user would see it, so the
// screenshot is the evidence rather than a state object. `window.__r88mode` picks the picture:
// 'view' | 'over' | 'range' | 'zoom' | 'zoom-fired'.
//
// Reads no URL and no token.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const mode = window.__r88mode || 'view';
    let ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    for (let i = 0; i < 60 && !ev; i += 1) {
        await sleep(2000);
        ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    }
    if (!ev) return JSON.stringify({ fatal: 'SEI event absent',
        ids: (v.eventGroups || []).map((e) => e.eventId).slice(0, 12) });
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);

    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = 8;
    v.peSelection.size = '720';
    v.peSelection.cameras = mode.startsWith('zoom') ? ['front', 'back'] : ['front', 'back'];
    v.peSelection.overlay = { ...v.readExportOverlay(),
        label: true, badge: true, stamp: true, hud: true, bar: true, state: true,
        gps: false, source: false, mosaic: false, place: 'tc', bg: 'stroke', scale: 1 };
    v.peCaptionKey = null;
    v.peTelemetryKey = null;
    await v.showPhoneExportModal();
    await sleep(200);
    // The zoom layer is sticky across invocations, so every mode starts by closing it; otherwise the
    // first 'zoom' shot leaves it on top and the following page shots photograph it instead.
    v.closePhoneExportZoom();
    await sleep(300);
    if (!v.pePreviewOn) v.togglePhoneExportPreview();
    v.setPhoneExportPane(mode === 'over' ? 'over' : mode === 'range' ? 'range' : 'view');
    for (let i = 0; i < 40 && /正在取帧|Fetching/.test(v.peDom.previewCap.textContent || ''); i += 1) {
        await sleep(500);
    }
    if (mode.startsWith('zoom')) {
        v.openPhoneExportZoom();
        await sleep(900);
        // Swiping to a later second is what the layer exists for; the shot should not be 00:00.
        v.setPeZoomSecond(3);
        await sleep(2500);
    }
    const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
        return [Math.round(b.width), Math.round(b.height), Math.round(b.top)]; };
    // screencap has returned the *previous* frame for a pane switch (two byte-identical PNGs for
    // view/over), so let the compositor present before the caller shoots.
    await sleep(800);
    return JSON.stringify({
        mode,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        viewport: [window.innerWidth, window.innerHeight],
        pane: v.pePane,
        cap: v.peDom.previewCap.textContent,
        zoomCap: document.getElementById('peZoomCap').textContent,
        zoomTime: document.getElementById('peZoomTime').textContent,
        zoomAt: +v.peZoomAt.toFixed(2),
        previewBox: box(v.peDom.preview),
        zoomShown: document.getElementById('peZoomModal').classList.contains('show'),
        chips: Array.from(document.querySelectorAll('#peChromeChips .recent-chip'))
            .map((c) => c.textContent + (c.classList.contains('on') ? '*' : '')),
        labels: v.phoneExportPlan().cameras.map((c) => [c.camera, c.label, c.triggered, c.trigger]),
        layers: v.phoneLayerCount(),
    }, null, 1);
})()
