// R153 #12 · 准备：打开 sentry 事件，导出面板选 front+back、范围 0–1s，不启动。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 60 && !v.eventGroups.length; i++) await sleep(250);
  }
  const ev = (v.eventGroups || []).find(g => /sentry/.test(g.eventId));
  if (!ev) return JSON.stringify({ harness: 'no sentry event' });
  if (!v.currentEvent || v.currentEvent.eventId !== ev.eventId) { await v.playEvent(ev.eventId); await sleep(3000); }
  const vc = v.videoControls;
  for (let i = 0; i < 40 && !(vc.totalDuration > 0); i++) await sleep(250);
  vc.clipStartTime = 0;
  vc.clipEndTime = Math.min(1, vc.totalDuration);
  await v.showPhoneExportModal();
  await sleep(600);
  v.peSelection.cameras = ['front', 'back'];
  for (const k of Object.keys(v.peSelection.overlay)) v.peSelection.overlay[k] = false;
  v.renderPhoneExportPanel();
  await sleep(400);
  const plan = v.phoneExportPlan();
  window.__toasts = [];
  if (!v.__toastHook) {
    const orig = v.showToast.bind(v);
    v.showToast = (msg, ...rest) => { window.__toasts.push(String(msg)); return orig(msg, ...rest); };
    v.__toastHook = true;
  }
  window.__peTerm = [];
  if (!v.__peHook) {
    const orig = v.onPhoneExportProgress.bind(v);
    v.onPhoneExportProgress = (p) => {
      if (p && ['done', 'cancelled', 'error'].includes(p.phase)) window.__peTerm.push(p);
      return orig(p);
    };
    v.__peHook = true;
  }
  return JSON.stringify({ plan: { error: plan.error || null, cams: plan.cameras.map(c => c.camera) } });
})()
