(() => {
  const g = document.getElementById('headerActionsGroup');
  const rows = [...g.querySelectorAll('button')].filter(b => {
    const s = getComputedStyle(b);
    return s.display !== 'none' && b.getBoundingClientRect().width > 0;
  });
  const bad = [];
  for (const b of rows) {
    const r = b.getBoundingClientRect();
    const cx = Math.round(r.x + r.width / 2), cy = Math.round(r.y + r.height / 2);
    const hit = document.elementFromPoint(cx, cy);
    const self = hit ? (hit === b || b.contains(hit)) : false;
    if (!self) bad.push({ id: b.id, c: [cx, cy], hit: hit ? (hit.id || (hit.tagName + ' ' + (hit.className || '').toString().slice(0, 26))) : 'offscreen' });
  }
  return JSON.stringify({ total: rows.length, badCount: bad.length, bad }, null, 1);
})()
