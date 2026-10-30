// P3 #18 的真实一跑：把 durationUs 灌成 7 小时喂给引擎，看它是否**在 parse 处**拒绝、
// 报错里带不带 code，以及页面能不能用词典把这句话组出来（不许回落成引擎原句）。
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
  await sleep(400);
  const plan = v.phoneExportPlan();
  if (plan.error) return JSON.stringify({ fatal: 'plan error', error: plan.error });

  const translations = i18n[v.currentLanguage];
  const payload = {
    id: (Date.now() % 1e9) + 7,
    outPath: v.peOutPath(plan),
    width: plan.width, height: plan.height, fps: 30,
    durationUs: 7 * 60 * 60 * 1000 * 1000,        // 七小时，越过 MAX_DURATION_US
    rows: plan.rows, cols: plan.cols, cameras: plan.cameras,
    captions: v.phoneExportCaptions(), wm: v.wmOptions(plan), chrome: v.chromeOptions(),
    labels: translations.peNotifLabels,
  };
  const reply = await nativeAsk('startExport', JSON.stringify(payload));
  await sleep(2500);
  const status = await nativeAskJson('exportStatus');
  const p = status && status.payload;
  const composed = p ? v.engineText(p) : null;
  const zh = /[\u4e00-\u9fff]/;
  const out = {
    reply: String(reply).slice(0, 80),
    running: status && status.running, delivered: status && status.delivered,
    phase: p && p.phase, code: p && p.code, rawMessage: p && p.message,
    lang: v.currentLanguage, rawHasChinese: !!p && zh.test(String(p.message || '')),
    composed, jobStillTracked: !!v.peJob,
    // 判据：码在、页面组得出词、词里带上限小时数、且没有把引擎的英文原句直接端上去
    verdict: !!(p && p.code === 'tooLong' && composed && composed !== p.message
        && /6/.test(composed) && composed.length > 8),
  };
  if (typeof v.hidePhoneExportModal === 'function') v.hidePhoneExportModal();
  return JSON.stringify(out, null, 1);
})()
