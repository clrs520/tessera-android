(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const cs = el => getComputedStyle(el);
  const header = document.querySelector('.main-header');
  const hr = document.getElementById('headerRight');
  const g = document.getElementById('headerActionsGroup');
  const plate = document.getElementById('metaDetailOverlay');
  const overlay = document.getElementById('videoControlsOverlay');
  const rows = [...g.querySelectorAll('button')].filter(b => cs(b).display !== 'none' && b.getBoundingClientRect().width > 0);
  const bad = [];
  for (const b of rows) {
    const q = b.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.round(q.x + q.width / 2), Math.round(q.y + q.height / 2));
    if (!hit || (hit !== b && !b.contains(hit))) bad.push({ id: b.id, hit: hit ? (hit.id || hit.tagName + ' ' + (hit.className || '').toString().slice(0, 22)) : 'offscreen' });
  }
  return JSON.stringify({
    hrCls: hr.className, headerCls: header.className, headerZ: cs(header).zIndex,
    hasBump: (() => { try { return !!document.querySelector('.main-header:has(.header-right.active)'); } catch (e) { return 'unsupported'; } })(),
    panelRect: r(g), panelDisp: cs(g).display,
    plate: { rect: r(plate), z: cs(plate).zIndex, d: cs(plate).display },
    overlay: { rect: r(overlay), z: cs(overlay).zIndex, pe: cs(overlay).pointerEvents, cls: overlay.className },
    total: rows.length, badCount: bad.length, bad,
  }, null, 1);
})()
