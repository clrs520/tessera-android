(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await v.showPhoneExportModal();
  const chips = [...document.querySelectorAll('.phone-export-panel .recent-chip[data-camera]')];
  const want = ['front', 'back', 'left', 'right'];
  want.forEach(c => { const el = chips.find(x => x.dataset.camera === c); if (el) el.click(); });
  await sleep(500);
  const plan = v.phoneExportPlan();
  const info = { selected: (v.peSelection.cameras || []).slice(), cams: (plan.cameras || []).map(c => c.camera || c.id || String(c)),
    w: plan.width, h: plan.height, rows: plan.rows, cols: plan.cols, durUs: plan.durationUs, error: plan.error || null };
  if (!plan.error) { v.startPhoneExport(); await sleep(2500); }
  return JSON.stringify({ info, job: !!v.peJob, percent: v.pePercent });
})()
