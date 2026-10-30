(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const c = v.videoControls;
    const snap = tag => `${tag} clip=${c.clipStartTime}/${c.clipEndTime} mode=${c.clipMode || '-'} err=${(v.phoneExportPlan().error) || 'none'}`;
    const rows = [snap('before opening the page')];
    await v.showPhoneExportModal();
    await sleep(600);
    rows.push(snap('after showPhoneExportModal'));
    v.peSelection.cameras = ['front'];
    v.renderPhoneExportPanel();
    await sleep(400);
    rows.push(snap('after single camera'));
    const p = v.phoneExportPlan();
    return JSON.stringify({ rows, previewOn: v.pePreviewOn, plan: { err: p.error || null, start: p.start, end: p.end } }, null, 1);
})();
