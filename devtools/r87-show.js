// R87 appearance setup: leave the sheet open with the watermark on and the preview frame painted, so
// the screenshot shows what the user would see rather than a state object. The probe itself only
// reports geometry — the picture is the evidence, and a computed-style pass has hidden a broken
// stylesheet before (R42).
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_09-00-00'));
    for (let i = 0; i < 60 && !ev; i += 1) {
        await sleep(2000);
        ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_09-00-00'));
    }
    if (!ev) return JSON.stringify({ fatal: 'SEI event absent' });
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(ev.telemetrySamples || []).length; i += 1) await sleep(500);

    v.peSelection.cameras = ['front'];
    v.peSelection.size = '720';
    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = 6;
    v.peSelection.overlay = { ...v.readExportOverlay(), stamp: true, hud: true, state: true,
        bar: true, gps: true, source: true, mosaic: false, place: 'tc', bg: 'stroke', scale: 1 };
    v.peCaptionKey = null;
    await v.showPhoneExportModal();
    await sleep(600);
    if (!v.pePreviewOn) v.togglePhoneExportPreview();
    for (let i = 0; i < 30 && !v.pePreviewOn; i += 1) await sleep(500);
    await sleep(4000);
    const cap = document.getElementById('pePreviewCap');
    const canvas = document.getElementById('pePreviewCanvas');
    return JSON.stringify({
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
        viewport: [window.innerWidth, window.innerHeight],
        cap: cap ? cap.textContent : null,
        canvasShown: canvas ? getComputedStyle(canvas).display : null,
        canvasBox: canvas ? (() => { const b = canvas.getBoundingClientRect();
            return [Math.round(b.width), Math.round(b.height)]; })() : null,
        wmStyleShown: getComputedStyle(document.getElementById('peWmStyle')).display,
        places: Array.from(document.querySelectorAll('#peWmPlaces .recent-chip'))
            .map((c) => c.textContent + (c.classList.contains('on') ? '*' : '')),
        bgs: Array.from(document.querySelectorAll('#peWmBgChips .recent-chip'))
            .map((c) => c.textContent + (c.classList.contains('on') ? '*' : '')),
        scaleOut: (document.getElementById('peWmScaleOut') || {}).textContent,
        wmArea: (() => {
            const plan = v.phoneExportPlan();
            const canvas2 = document.createElement('canvas');
            canvas2.width = plan.width; canvas2.height = plan.height;
            const r = v.pePaintPreviewWatermark(canvas2.getContext('2d'), canvas2, null);
            return r ? { pct: +((r.w * r.h) / (plan.width * plan.height) * 100).toFixed(2),
                dims: [plan.width, plan.height] } : null;
        })(),
    }, null, 1);
})()
