(() => {
  const q = (s) => document.querySelector(s);
  const rect = (s) => { const n = q(s); if (!n) return null; const r = n.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; };
  const cs = (s) => { const n = q(s); if (!n) return '缺节点'; const c = getComputedStyle(n); return c.display + '/' + c.visibility + '/' + c.opacity; };
  const tabs = [...document.querySelectorAll('.tab-btn')].map((t) => (t.className || '') + ':' + (t.getAttribute('data-tab') || ''));
  return JSON.stringify({
    playingTab: (q('.tab-btn.on') || {}).textContent?.trim().slice(0, 12),
    tabs,
    playerArea: rect('.player-area'),
    menuBtn: rect('.header-menu-btn'),
    menuBtnStyle: cs('.header-menu-btn'),
    headerRight: rect('.header-right'),
    hdrRightStyle: cs('.header-right'),
    bar: rect('.phone-action-bar'),
    panelStyle: cs('.header-collapsed .header-actions-group'),
    videos: [...document.querySelectorAll('video')].slice(0, 3).map((v) => v.videoWidth + 'x' + v.videoHeight + ' ready=' + v.readyState),
    current: typeof getCurrentEvent === 'function' ? String((getCurrentEvent() || {}).eventId || '').slice(-19) : '(无函数)',
  });
})()
