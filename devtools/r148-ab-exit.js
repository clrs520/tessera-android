// R148 判据 A（页面侧）：退出剪辑模式必须把 A-B 循环一起关掉，面板文案跟着改。
// 修复前：clipStart/End 被清空、循环读不到点，但 loopAB 仍是 true、标签还写「开」。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  const ev = v.eventGroups.find(e => (e.segments || []).length) || v.eventGroups[0];
  if (!v.currentEvent || v.currentEvent.eventId !== ev.eventId) {
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && document.querySelector('.player-area')?.classList.contains('empty'); i++) await sleep(250);
  }
  const vc = v.videoControls;
  const readBtn = () => {
    const b = v.dom.loopABBtn;
    return b ? { text: b.querySelector('.btn-text')?.textContent || null, pressed: b.getAttribute('aria-pressed') } : null;
  };

  if (vc.clipModeActive !== true) { vc.toggleClipMode(); await sleep(400); }
  const inClip = vc.clipModeActive === true;
  // 造一个确定的区间，再把循环打开。
  vc.clipStartTime = 5;
  vc.clipEndTime = 10;
  v.loopAB = true;
  v.updateLoopABLabel();
  await sleep(150);
  const on = readBtn();

  vc.toggleClipMode();            // 退出剪辑模式
  await sleep(400);
  const after = { clipMode: vc.clipModeActive === true, loopAB: v.loopAB === true,
                  clipA: vc.clipStartTime, clipB: vc.clipEndTime };
  const off = readBtn();

  const ok = inClip && !after.clipMode && after.loopAB === false
             && !!on && !!off && on.text !== off.text && off.pressed === 'false';
  return JSON.stringify({ ok, inClip, after, on, off });
})()
