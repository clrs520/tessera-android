(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.currentEvent) { v.playEvent(v.eventGroups.find(g => (g.segments || []).length >= 3)); await sleep(4000); }
  await v.showPhoneExportModal();
  await sleep(500);

  const cams = [...document.querySelectorAll('.phone-export-panel [data-camera]')];
  cams.slice(0, 4).forEach(c => c.click());
  const chrome = [...document.querySelectorAll('#peChromeChips button')];
  chrome.forEach(c => { if (c.getAttribute('aria-selected') !== 'true' && c.getAttribute('aria-pressed') !== 'true') c.click(); });
  await sleep(600);

  const plan = v.phoneExportPlan();
  const before = { chips: cams.length, selected: (v.peSelection.cameras || []).slice(),
    planCams: (plan.cameras || []).length, w: plan.width, h: plan.height,
    durUs: plan.durationUs, error: plan.error || null,
    chromeToggles: chrome.map(c => c.textContent.trim() + '=' + (c.getAttribute('aria-selected') || c.getAttribute('aria-pressed'))),
    wmPlace: (v.wmOptions ? v.wmOptions(plan).place : '?') };
  if (plan.error) return JSON.stringify({ before });

  await v.startPhoneExport();
  const t = Date.now();
  let sawJob = false;
  while (Date.now() - t < 150000) {
    if (v.peJob) sawJob = true;
    else if (sawJob) break;
    await sleep(1500);
  }
  return JSON.stringify({ before, sawJob, percent: v.pePercent, stillJob: !!v.peJob,
    progressText: (document.getElementById('peProgressText') || {}).textContent || '',
    seconds: Math.round((Date.now() - t) / 1000) }, null, 1);
})()
