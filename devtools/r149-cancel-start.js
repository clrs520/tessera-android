// R149：起一个 60s 的导出，180ms 后取消。判据在外层 shell 里看 Download 有没有多出「空壳」。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  if (!v.eventGroups.length) return JSON.stringify({ fatal: 'no events' });
  const ev = v.eventGroups.find(g => (g.segments || []).length);
  if (!v.currentEvent || v.currentEvent.eventId !== ev.eventId) {
    await v.playEvent(ev.eventId);
    await sleep(2500);
  }
  await v.showPhoneExportModal();
  let cams = [];
  for (let i = 0; i < 50; i++) {
    cams = [...document.querySelectorAll('.phone-export-panel [data-camera]')];
    if (cams.length) break;
    await sleep(100);
  }
  if (!cams.length) return JSON.stringify({ fatal: 'no camera chips' });
  cams.forEach(c => { if (c.classList.contains('on')) c.click(); });
  cams[0].click();
  const c = v.videoControls;
  c.clipStartTime = 0;
  c.clipEndTime = 60;
  c.updateClipSelection && c.updateClipSelection();
  await sleep(300);
  if (v.phoneExportPlan().error) return JSON.stringify({ fatal: v.phoneExportPlan().error });

  await v.startPhoneExport();
  for (let i = 0; i < 40 && !v.peJob; i++) await sleep(30);
  const started = !!v.peJob;
  await sleep(180);
  v.cancelPhoneExport();
  for (let i = 0; i < 120 && v.peJob; i++) await sleep(250);
  return JSON.stringify({ ok: started, started, stillJob: !!v.peJob });
})()
