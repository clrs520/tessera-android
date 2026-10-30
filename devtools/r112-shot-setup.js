(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const vv = window.viewer;
  const ev = vv && (vv.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')));
  if (ev && vv.playEvent) { try { await vv.playEvent(ev.eventId); } catch (e) { } }
  for (let i = 0; i < 24 && !document.querySelectorAll('.lens-on').length; i++) {
    try { markLensSurfaces(); } catch (e) { }
    await sleep(250);
  }
  try { if (typeof setLayout === 'function') setLayout('single'); } catch (e) { }
  await sleep(3000);
  try { if (typeof pauseAll === 'function') pauseAll(); } catch (e) { }
  await sleep(1500);
  const btn = document.querySelector('.header-menu-btn') || document.querySelector('.header-right button');
  const r = btn ? btn.getBoundingClientRect() : null;
  const hr = document.querySelector('.header-right');
  if (hr) hr.classList.remove('active');
  return JSON.stringify({
    event: ev ? String(ev.eventId).slice(-19) : null,
    cls: document.documentElement.className.slice(0, 60),
    playing: !!window.playing,
    lens: document.querySelectorAll('.lens-on').length,
    btnRect: r ? { x: Math.round((r.left + r.width / 2) * 2.7), y: Math.round((r.top + r.height / 2) * 2.7), cssW: Math.round(r.width) } : null,
  });
})()
