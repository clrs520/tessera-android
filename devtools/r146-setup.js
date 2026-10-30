// R146 判据的「进入现场」：横屏 + 真事件 + 大小窗 + 遮罩收起，并且把前置条件自证一遍。
// 前置不成立就 ok:false —— 判据不许在 empty / 遮罩还开着 / 小窗根本点不到的状态里白捡通过。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ ok: false, why: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // 方向由外层 shell 用 innerWidth 卡死，这里不再假定只有横屏可测（竖屏那一档是反例守卫）。
  if (!v.eventGroups || !v.eventGroups.length) {
    // 判据自己造前置条件：冷启动后 app 数据是空的，不主动指目录就会一直「no events」。
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
    if (!v.eventGroups.length) return JSON.stringify({ ok: false, why: 'scan gave no events' });
  }

  const ev = v.eventGroups.find(e => (e.videos || []).length >= 4) || v.eventGroups[0];
  const mcp = v.multiCameraPlayer;
  if (!v.currentEvent || v.currentEvent.eventId !== ev.eventId) {
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && document.querySelector('.player-area')?.classList.contains('empty'); i++) await sleep(250);
  }
  mcp.setCamera('front');
  mcp.setLayout('legacy');
  await sleep(500);

  const ov = document.getElementById('videoControlsOverlay');
  // `hideControls()` 在暂停态是拒绝的（「暂停就别藏，用户还要看控件」）。用户报的是**播放中**
  // 遮罩自动收起后那一下，所以这里必须真的在播；播不起来就报 fatal，不许在暂停态里测。
  if (!v.videoControls.isPlaying) { try { v.videoControls.togglePlayPause(); } catch (e) {} }
  for (let i = 0; i < 40 && !v.videoControls.isPlaying; i++) await sleep(250);
  if (!v.videoControls.isPlaying) return JSON.stringify({ ok: false, why: 'not playing on this AVD' });
  v.videoControls.hideControls();
  for (let i = 0; i < 20 && ov.classList.contains('show'); i++) await sleep(200);

  const centre = cam => { const e = document.getElementById(`${cam}-container`); if (!e) return null;
      const b = e.getBoundingClientRect(); return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2) }; };
  const pipOk = cam => { const c = centre(cam); const n = c && document.elementFromPoint(c.x, c.y);
      return { c, onPip: !!(n && n.closest('.video-container.is-pip')), cls: document.getElementById(`${cam}-container`)?.className.replace('video-container', '').trim() }; };

  const L = pipOk('left'), B = pipOk('back');
  const pre = { landscape: `${innerWidth}x${innerHeight}`, layout: mcp.layoutMode, active: mcp.activeCamera,
                overlayShown: ov.classList.contains('show'), overlayPe: getComputedStyle(ov).pointerEvents,
                leftCls: L.cls, leftOnPip: L.onPip, backOnPip: B.onPip };
  const ok = pre.layout === 'legacy' && pre.active === 'front' && !pre.overlayShown
             && pre.overlayPe === 'none' && L.onPip && B.onPip;
  return JSON.stringify({ ok, ...pre, tapX: L.c.x, tapY: L.c.y, backX: B.c.x, backY: B.c.y });
})()
