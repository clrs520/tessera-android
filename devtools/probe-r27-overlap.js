(() => {
  const app = window.viewer;
  const group = document.getElementById('headerActionsGroup');
  const plate = document.getElementById('metaDetailOverlay');
  const panel = document.getElementById('metadataPanel');
  const pb = panel?.getBoundingClientRect();
  const rb = group?.getBoundingClientRect();
  const pl = plate?.getBoundingClientRect();
  const rows = group ? [...group.querySelectorAll('button')].filter(b => {
    const r = b.getBoundingClientRect();
    return r.height > 0 && getComputedStyle(b).display !== 'none';
  }) : [];
  const hits = rows.map(b => {
    const r = b.getBoundingClientRect();
    const el = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
    return { id: b.id || b.dataset?.action || b.textContent.trim().slice(0, 6), y: Math.round(r.y),
      self: b === el || (el && el.contains(b)) || (b.contains && b.contains(el)), tag: el ? (el.id || el.className).toString().slice(0, 40) : null };
  });
  const overlap = (a, b) => a && b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0;
  return JSON.stringify({
    headerZ: getComputedStyle(document.querySelector('.main-header')).zIndex,
    plateZ: getComputedStyle(plate).zIndex,
    group: rb ? { x: Math.round(rb.x), y: Math.round(rb.y), w: Math.round(rb.width), h: Math.round(rb.height) } : null,
    plate: pl && getComputedStyle(plate).display !== 'none'
      ? { x: Math.round(pl.x), y: Math.round(pl.y), w: Math.round(pl.width), h: Math.round(pl.height) } : null,
    hudVisible: !!pb && getComputedStyle(panel).display !== 'none' && !panel.classList.contains('collapsed')
      ? { x: Math.round(pb.x), y: Math.round(pb.y), w: Math.round(pb.width), h: Math.round(pb.height) } : null,
    plateOverGroupPx: Math.round(overlap(pl, rb)),
    hudOverPlatePx: Math.round(overlap(pl, pb)),
    rows: hits,
  }, null, 1);
})()
