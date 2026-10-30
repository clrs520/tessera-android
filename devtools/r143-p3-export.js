// 本轮改了 parse / report / 终态 payload 的组词， happy path 必须真跑一遍：
// 一路、约 10 秒、带标签角标，全程记录页面自己的进度行文字（引擎不许再交中文原句）。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.currentEvent) { v.playEvent(v.eventGroups.find(g => (g.segments || []).length >= 2)); await sleep(4000); }
  await v.showPhoneExportModal();
  {
    const t0 = Date.now();
    while (!document.getElementById('phoneExportModal').classList.contains('show') && Date.now() - t0 < 3000) {
      await sleep(100);
    }
  }
  const cams = [...document.querySelectorAll('.phone-export-panel [data-camera]')];
  cams.forEach(c => { if (c.classList.contains('on')) c.click(); });
  cams[0].click();
  // 只截前 10 秒，让这一跑留在一分钟以内
  const controls = v.videoControls;
  controls.clipStartTime = 0;
  controls.clipEndTime = 10;
  controls.updateClipSelection && controls.updateClipSelection();
  await sleep(500);
  const plan = v.phoneExportPlan();
  if (plan.error) return JSON.stringify({ fatal: plan.error });

  const seen = [];
  const textEl = document.getElementById('peProgressText');
  const watcher = setInterval(() => {
    const t = (textEl && textEl.textContent || '').trim();
    if (t && t !== seen[seen.length - 1]) seen.push(t);
  }, 400);
  const t0 = Date.now();
  await v.startPhoneExport();
  while (v.peJob && Date.now() - t0 < 300000) await sleep(1500);
  clearInterval(watcher);
  return JSON.stringify({
    lang: v.currentLanguage,
    plan: { cams: (plan.cameras || []).length, w: plan.width, h: plan.height, durUs: plan.durationUs },
    stillJob: !!v.peJob, seconds: Math.round((Date.now() - t0) / 1000),
    progressLines: seen,
    // 「最近导出」那一行是页面在 done 落地后自己写的，文件真在里面才算数
    recent: [...document.querySelectorAll('#peExports button, #peExports .recent-chip')]
        .map(b => b.textContent.trim()).slice(0, 3),
    startBtnEnabled: document.getElementById('peStartBtn').disabled === false,
  }, null, 1);
})()
