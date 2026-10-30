// R151 #28 · 速度曲线命中区（必须在播放页、没有导出页盖着时跑）。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  if (!v) return JSON.stringify({ harness: 'viewer never appeared' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { checks: [], pass: 0, total: 0, harness: null };
  // The player surface has to exist before the graph has a layout at all: a cold launch sits on the
  // home page and the (hidden) transport row measures 0×0.
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  const ev = v.eventGroups.find(g => (g.segments || []).length >= 3);
  if (!ev) { out.harness = 'no event with ≥3 segments'; return JSON.stringify(out); }
  if (!v.currentEvent) { await v.playEvent(ev.eventId); await sleep(2500); }
  const ok = (n, p, d) => { out.total++; if (p) out.pass++; out.checks.push({ name: n, pass: !!p, detail: d }); };
  v.closePhoneExportZoom?.();
  v.hidePhoneExportModal?.();
  for (let i = 0; i < 20; i++) {
    const open = v.peDom && v.peDom.modal.classList.contains('show');
    const zoom = v.peDom?.zoomModal?.classList.contains('show');
    if (!open && !zoom) break;
    await new Promise(r => setTimeout(r, 150));
  }
  const g = v.videoControls.speedGraphContainer;
  if (!g) { out.harness = 'no speed graph'; return JSON.stringify(out); }
  v.videoControls.showControls?.();
  v.videoControls.resetHideTimer?.();
  g.classList.add('visible');
  await new Promise(r => setTimeout(r, 150));
  // The 3 s auto-hide can fire between showControls() and the measurement; re-arm and wait for the
  // row to actually own its centre before asking what the extra 5 px above it hits.
  let control = null, gb = g.getBoundingClientRect(), cx = gb.left + gb.width / 2;
  for (let i = 0; i < 20; i++) {
    v.videoControls.resetHideTimer?.();
    g.classList.add('visible');
    gb = g.getBoundingClientRect();
    cx = gb.left + gb.width / 2;
    control = document.elementFromPoint(cx, gb.top + 5);
    if (control && (control === g || g.contains(control))) break;
    await new Promise(r => setTimeout(r, 120));
  }
  const cs = getComputedStyle(g, '::before');
  // Control point: if even the middle of the drawn row is not this container, something else owns
  // the screen (export sheet, zoom layer) and the judgement would be measuring the wrong surface.
  if (!gb.width || !gb.height) {
    out.harness = { rect: { w: gb.width, h: gb.height } };
    return JSON.stringify(out);
  }
  if (!control || !(control === g || g.contains(control))) {
    out.harness = { control: control ? (control.id || control.className) : null,
      overlay: v.videoControls.overlay.className,
      graphOpacity: getComputedStyle(g).opacity,
      modal: v.peDom && v.peDom.modal.classList.contains('show'),
      zoom: v.peDom?.zoomModal?.classList.contains('show') };
    return JSON.stringify(out);
  }
  const above = document.elementFromPoint(cx, gb.top - 5);
  const aboveInside = !!above && (above === g || g.contains(above));
  g.classList.remove('visible');
  const aboveHidden = document.elementFromPoint(cx, gb.top - 5);
  const hiddenInside = !!aboveHidden && (aboveHidden === g || g.contains(aboveHidden));
  g.classList.add('visible');
  ok('speed graph hit area grows to 40px upward, only while the curve is drawn',
    cs.height === '40px' && cs.pointerEvents === 'auto' && aboveInside && !hiddenInside,
    { pseudoHeight: cs.height, pseudoPe: cs.pointerEvents, aboveInside, hiddenInside,
      aboveTarget: above ? (above.id || above.className) : null });
  g.classList.remove('visible');
  return JSON.stringify(out);
})()
