// R146 取证：横屏大小窗（legacy）里，点小窗为什么换不了大小。
// 假设：`.video-controls-overlay`（z-index 40，`.show` 时 pointer-events:all）压在
//        `pos-bottom-left/right` 两支小窗（z-index 20）上面 ⇒ 第二次点击命中的是遮罩不是小窗。
// 量法：同一支小窗的中心，在「遮罩收起」与「遮罩展开」两态各做一次 elementFromPoint
//       （它答的是命中，不是绘制顺序 —— 正是这条假设要问的）。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const d = devicePixelRatio;
  if (!v.eventGroups || !v.eventGroups.length) return JSON.stringify({ fatal: 'no events' });

  const ev = v.eventGroups.find(e => (e.videos || []).length >= 4) || v.eventGroups[0];
  if (!v.currentEvent || v.currentEvent.eventId !== ev.eventId) {
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && document.querySelector('.player-area')?.classList.contains('empty'); i++) await sleep(250);
  }
  const mcp = v.multiCameraPlayer;
  mcp.setLayout('legacy');
  await sleep(500);
  if (v.videoControls?.isPlaying) { v.videoControls.pause?.(); }   // 只量几何，别在 AVD 上开六路解码
  await sleep(300);

  const area = document.getElementById('playerArea');
  const overlay = document.getElementById('videoControlsOverlay');
  const pipOf = cam => document.getElementById(`${cam}-container`);
  const centreOf = el => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), b }; };
  const who = (x, y) => { const n = document.elementFromPoint(x, y); if (!n) return 'null';
      return (n.id ? '#' + n.id : n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).split(' ')[0] : '')); };

  const read = () => {
    const o = {};
    for (const cam of ['back', 'left', 'right', 'front']) {
      const el = pipOf(cam); if (!el) continue;
      const { x, y, b } = centreOf(el);
      o[cam] = { cls: el.className.replace('video-container', '').trim(),
                 rect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
                 centre: { x, y }, hit: who(x, y),
                 isPipTarget: !!document.elementFromPoint(x, y)?.closest?.('.video-container.is-pip') };
    }
    return o;
  };

  // 态 A：遮罩收起（pointer-events:none）
  overlay.classList.remove('show');
  await sleep(120);
  const hiddenA = read();
  const stA = { show: overlay.classList.contains('show'), pe: getComputedStyle(overlay).pointerEvents,
                z: getComputedStyle(overlay).zIndex, pipZ: getComputedStyle(pipOf('left')).zIndex };

  // 态 B：遮罩展开（.show ⇒ pointer-events:all）
  v.videoControls.showControls();
  await sleep(400);
  const shownB = read();
  const ob = overlay.getBoundingClientRect();
  const stB = { show: overlay.classList.contains('show'), pe: getComputedStyle(overlay).pointerEvents,
                rect: { x: Math.round(ob.x), y: Math.round(ob.y), w: Math.round(ob.width), h: Math.round(ob.height) } };

  return JSON.stringify({
    orient: `${innerWidth}x${innerHeight}`, dpr: d, layout: mcp.layoutMode, active: mcp.activeCamera,
    areaRect: (() => { const b = area.getBoundingClientRect(); return { y: Math.round(b.y), h: Math.round(b.height) }; })(),
    controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h').trim(),
    stateHidden: stA, stateShown: stB,
    pipA: hiddenA, pipB: shownB,
  }, null, 1);
})()
