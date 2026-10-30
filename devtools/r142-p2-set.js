// R142 P2 mockup: apply one arrangement to the real export page and report its geometry.
// window.__p2 = { name, cams, layout }. No source files change; the preview is the app's own.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const cfg = window.__p2;
    if (!cfg || !v) return JSON.stringify({ error: 'no config/viewer' });
    if (v.multiCameraPlayer?.isPlaying) v.multiCameraPlayer.pauseAll();
    await v.showPhoneExportModal();
    v.peSelection.cameras = cfg.cams.slice();
    v.peSelection.layout = JSON.parse(JSON.stringify(cfg.layout || {}));
    v.renderPhoneExportPanel();
    let label = '';
    for (let i = 0; i < 30; i += 1) {
        await sleep(400);
        label = document.querySelector('.pe-dock-head .pe-label')?.textContent || '';
        if (label.includes('×')) break;
    }
    const plan = v.phoneExportPlan();
    const cv = document.querySelector('.pe-preview')?.getBoundingClientRect();
    const dock = document.querySelector('.pe-preview-dock')?.getBoundingClientRect();
    const panel = document.querySelector('.phone-export-panel');
    return JSON.stringify({
        name: cfg.name,
        plan: plan.error ? { error: plan.error } : [plan.width, plan.height],
        planRatio: plan.width && plan.height ? +(plan.width / plan.height).toFixed(3) : null,
        wide: panel?.classList.contains('pe-wide-preview'),
        canvas: cv ? [Math.round(cv.width), Math.round(cv.height)] : null,
        dock: dock ? [Math.round(dock.x), Math.round(dock.y), Math.round(dock.width), Math.round(dock.height)] : null,
        label,
    });
})()
