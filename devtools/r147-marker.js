// R147 判据（前半）：把事件红点的位置和它代表的那一秒算出来，交给 shell 用真手指点。
// 红点自己没有 dataset 时间，但它的 left% 就是 timeOffset / totalDuration。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  const ev = v.eventGroups.find(e => e.eventTimestamp && e.startTime) || v.eventGroups[0];
  if (!v.currentEvent || v.currentEvent.eventId !== ev.eventId) {
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && document.querySelector('.player-area')?.classList.contains('empty'); i++) await sleep(250);
  }
  const vc = v.videoControls;
  // 暂停：暂停态 `hideControls()` 是拒绝的 ⇒ 控件条不会在量坐标与落指之间自己收起来。
  if (vc.isPlaying) { try { vc.togglePlayPause(); } catch (e) {} }
  for (let i = 0; i < 20 && vc.isPlaying; i++) await sleep(250);
  vc.showControls();
  await sleep(500);

  const cp = v.continuousPlayer;
  const total = cp.getTotalDuration();
  let m = document.querySelector('#progressContainer .event-marker');
  if (!m && v.currentEvent?.startTime) {
    // 这台机器的 fixture 没有 eventTimestamp，红点本来不会渲染。红点该不该画不是这一轮要验的
    // （验的是「点上去有没有反应」），所以拿真实事件的 startTime 造一个事件对象、走真正的
    // `addEventMarkers`，让点、命中区、监听全部由产品代码自己生成。
    const [d, t] = v.currentEvent.startTime.split('_');
    const base = new Date(`${d}T${(t || '00-00-00').replace(/-/g, ':')}`).getTime();
    const offset = Math.min(30, Math.max(2, Math.round(total * 0.3)));
    v.videoControls.addEventMarkers({ ...v.currentEvent, eventTimestamp: Math.round(base / 1000) + offset });
    await sleep(300);
    m = document.querySelector('#progressContainer .event-marker');
  }
  if (!m) return JSON.stringify({ ok: false, why: 'no event marker on this clip' });
  const pct = parseFloat(m.style.left);
  if (!isFinite(pct) || !total) return JSON.stringify({ ok: false, why: `pct=${m.style.left} total=${total}` });
  const expected = (pct / 100) * total;
  const b = m.getBoundingClientRect();
  const cx = Math.round(b.x + b.width / 2), cy = Math.round(b.y + b.height / 2);
  const hit = document.elementFromPoint(cx, cy);
  return JSON.stringify({
    ok: true, total: Math.round(total * 10) / 10,
    expected: Math.round(expected * 10) / 10,
    markerRect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
    tapX: cx, tapY: cy,
    hitIsMarker: !!(hit && hit.closest && hit.closest('.event-marker')),
    before: Math.round(cp.getCurrentTime() * 10) / 10,
  });
})()
