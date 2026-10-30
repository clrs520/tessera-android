(() => {
  const g = document.getElementById('headerActionsGroup');
  const plate = document.getElementById('metaDetailOverlay');
  const pr = plate.getBoundingClientRect();
  const rows = [...g.querySelectorAll('button')].filter(b => { const s = getComputedStyle(b); const r = b.getBoundingClientRect(); return s.display !== 'none' && r.width > 0; });
  const out = rows.map(b => {
    const r = b.getBoundingClientRect();
    const cx = Math.round(r.x + r.width / 2), cy = Math.round(r.y + r.height / 2);
    const hit = document.elementFromPoint(cx, cy);
    return { id: b.id, c: [cx, cy], self: !!hit && (hit === b || b.contains(hit)), hit: hit ? (hit.id || hit.tagName) : null };
  });
  return JSON.stringify({
    panelOpen: !!g.closest('.header-right.active') || getComputedStyle(g).display !== 'none',
    panelRect: (() => { const r = g.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    headerZ: getComputedStyle(document.querySelector('.main-header')).zIndex,
    plate: { d: getComputedStyle(plate).display, r: [Math.round(pr.x), Math.round(pr.y), Math.round(pr.width), Math.round(pr.height)] },
    allSelf: out.every(o => o.self), rows: out,
  }, null, 1);
})()
