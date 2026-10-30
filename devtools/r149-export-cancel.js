// R149 判据：取消要「不留空壳」。终止载荷里 frames 与 path 必须一致：
//   frames === 0  → path 必须是空串（没有 moov 的容器已经被删掉，不该出现在相册/最近导出）
//   frames  > 0   → path 非空（用户真的看到过一段，承诺过「已写入的片段保存在文件里」）
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  if (!v.eventGroups || !v.eventGroups.length) return JSON.stringify({ fatal: 'no events' });
  if (!v.currentEvent) { await v.playEvent(v.eventGroups.find(g => (g.segments || []).length)); await sleep(3000); }

  // 捕获原生推来的终止载荷（链在页面自己的处理前面，不替换它的行为）。
  const prev = window.__tdashcamExportProgress;
  window.__r149 = null;
  window.__tdashcamExportProgress = (p) => {
    try { const o = JSON.parse(p); if (o && ['done', 'cancelled', 'error'].includes(o.phase)) window.__r149 = o; } catch (e) {}
    if (typeof prev === 'function') prev(p);
  };

  await v.showPhoneExportModal();
  for (let i = 0; i < 30 && !document.getElementById('phoneExportModal').classList.contains('show'); i++) await sleep(100);
  // 相机芯片是面板渲染时才建出来的，等它真的出现再点。
  let cams = [];
  for (let i = 0; i < 50; i++) {
    cams = [...document.querySelectorAll('.phone-export-panel [data-camera]')];
    if (cams.length) break;
    await sleep(100);
  }
  if (!cams.length) return JSON.stringify({ fatal: 'no camera chips in the export panel' });
  cams.forEach(c => { if (c.classList.contains('on')) c.click(); });
  cams[0].click();
  const controls = v.videoControls;
  controls.clipStartTime = 0;
  controls.clipEndTime = 60;
  controls.updateClipSelection && controls.updateClipSelection();
  await sleep(400);
  if (v.phoneExportPlan().error) return JSON.stringify({ fatal: v.phoneExportPlan().error });

  await v.startPhoneExport();
  for (let i = 0; i < 40 && !v.peJob; i++) await sleep(50);
  await sleep(120);                       // 尽量在头几百毫秒内取消
  v.cancelPhoneExport();
  for (let i = 0; i < 120 && !window.__r149; i++) await sleep(250);

  const p = window.__r149;
  if (!p) return JSON.stringify({ ok: false, why: 'no terminal payload within 30s', stillJob: !!v.peJob });
  const frames = Number(p.frames) || 0;
  const path = String(p.path || '');
  const consistent = frames === 0 ? path === '' : path !== '';
  return JSON.stringify({
    ok: p.phase === 'cancelled' && consistent,
    phase: p.phase, frames, bytes: Number(p.bytes) || 0,
    pathEmpty: path === '', code: p.code || '', message: p.message || '',
  });
})()
