// R152 #10 待证项收口：0.3 秒级别导出是否仍被误判全黑（真机短片段、AVD 上真跑一遍）。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  const TARGET = 'TeslaCam/SavedClips/2026-10-23_14-40-00';
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 60 && !(v.eventGroups || []).some(g => g.eventId === TARGET); i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => g.eventId === TARGET);
  if (!ev) { out.harness = 'short event not scanned'; return JSON.stringify(out); }

  await v.playEvent(ev.eventId);
  for (let i = 0; i < 60 && !(v.videoControls.totalDuration > 0); i++) await sleep(250);
  const vc = v.videoControls;
  const total = vc.totalDuration || 0;
  if (!(total > 0)) { out.harness = 'no duration'; return JSON.stringify(out); }
  vc.clipStartTime = 0;
  vc.clipEndTime = Math.min(0.3, total);

  await v.showPhoneExportModal();
  await sleep(600);
  v.peSelection.cameras = ['front'];
  v.peSelection.overlay = Object.assign({}, v.peSelection.overlay, {
    chrome: false, labels: false, watermark: false, mosaic: false,
  });
  v.renderPhoneExportPanel();
  await sleep(400);
  const plan = v.phoneExportPlan();
  out.plan = { error: plan.error || null, range: [vc.clipStartTime, vc.clipEndTime], total: +total.toFixed(3) };
  if (plan.error) return JSON.stringify(out);

  // Capture the terminal payload before the page's own handler consumes it.
  window.__peTerm = [];
  if (!v.__peHook) {
    const orig = v.onPhoneExportProgress.bind(v);
    v.onPhoneExportProgress = (p) => {
      if (p && ['done', 'cancelled', 'error'].includes(p.phase)) window.__peTerm.push(p);
      return orig(p);
    };
    v.__peHook = true;
  }

  await v.startPhoneExport();
  const t = Date.now();
  let sawJob = false;
  while (Date.now() - t < 90000) {
    if (v.peJob) sawJob = true;
    else if (sawJob && window.__peTerm.length) break;
    if (window.__peTerm.length) break;
    await sleep(500);
  }
  const term = window.__peTerm[0] || null;
  out.result = {
    sawJob, seconds: Math.round((Date.now() - t) / 1000), stillJob: !!v.peJob,
    phase: term && term.phase, code: term && (term.code || ''), frames: term && term.frames,
    bytes: term && term.bytes, path: term && term.path ? term.path.split('/').pop() : '',
    progressText: (document.getElementById('peProgressText') || {}).textContent || '',
  };
  return JSON.stringify(out, null, 1);
})()
