// R151 导出冒烟：#24 改了 ExportHost 的状态通道，正常任务必须照旧跑完并落盘。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.currentEvent) {
    const ev = v.eventGroups.find(g => (g.segments || []).length >= 3);
    await v.playEvent(ev.eventId);
    await sleep(4000);
  }
  const vc = v.videoControls;
  const total = vc.totalDuration || 0;
  vc.clipStartTime = 0;
  vc.clipEndTime = Math.min(12, total) || total;
  await v.showPhoneExportModal();
  await sleep(600);
  v.peSelection.cameras = ['front'];
  v.peSelection.overlay = Object.assign({}, v.peSelection.overlay, {
    chrome: false, labels: false, watermark: false, mosaic: false,
  });
  v.renderPhoneExportPanel();
  await sleep(400);
  const plan = v.phoneExportPlan();
  if (plan.error) return JSON.stringify({ planError: plan.error });
  await v.startPhoneExport();
  const t = Date.now();
  let sawJob = false;
  while (Date.now() - t < 120000) {
    if (v.peJob) sawJob = true;
    else if (sawJob) break;
    await sleep(1200);
  }
  return JSON.stringify({ sawJob, seconds: Math.round((Date.now() - t) / 1000),
    stillJob: !!v.peJob, range: [vc.clipStartTime, vc.clipEndTime],
    progressText: (document.getElementById('peProgressText') || {}).textContent || '' }, null, 1);
})()
