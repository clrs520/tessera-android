// R151 #28 判据 · 准备：打开导出页，摆一个正常框和一个最小框（2%×3%），切到叠加页。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  if (!v) return JSON.stringify({ harness: 'viewer never appeared' });
  const s = ms => new Promise(r => setTimeout(r, ms));
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await s(500);
  }
  const ev = v.eventGroups.find(g => (g.segments || []).length >= 3);
  if (!ev) return JSON.stringify({ harness: 'no event with ≥3 segments' });
  if (!v.currentEvent) { await v.playEvent(ev.eventId); await s(4000); }
  v.closePhoneExportZoom?.();
  await v.showPhoneExportModal();
  await s(600);
  // The previous tap may have landed on the preview and opened the zoom layer; close it or every
  // later tap lands on that canvas instead of the mosaic editor.
  v.closePhoneExportZoom();
  await s(350);
  v.setPhoneExportPane('over');
  v.peSelection.overlay.mosaic = true;
  if (!v.peSelection.cameras.length) v.peSelection.cameras = ['front'];
  const cam = v.peMosaicCamera();
  v.peSelection.mosaic = { [cam]: [[0.10, 0.10, 0.35, 0.35], [0.62, 0.62, 0.02, 0.03]] };
  v.peMosaicSelected = null;
  v.renderPhoneExportPanel();
  v.renderPhoneOverlay();
  await s(500);
  const r = e => { if (!e) return null; const b = e.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  return JSON.stringify({
    cam, canvas: r(v.peDom.mosaicCanvas),
    boxes: [...v.peDom.mosaicCanvas.querySelectorAll('.pe-mosaic-box')].map(b => r(b)),
  });
})()
