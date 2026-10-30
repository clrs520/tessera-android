(() => {
  const mm = window.viewer.metadataManager;
  const R = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none') return null;
    const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), z: cs.zIndex }; };
  const panel = document.getElementById('metadataPanel');
  const plate = document.querySelector('.stats-overlay') || document.getElementById('statsOverlay');
  const overlap = (a, b) => { if (!a || !b) return 0; const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? Math.round(w * h) : 0; };
  return JSON.stringify({
    vp: [innerWidth, innerHeight],
    collapsed: panel.classList.contains('collapsed'),
    hud: R(panel), hudItemsShown: R(document.getElementById('metadataItems')),
    hudEmptyShown: R(document.getElementById('metadataEmpty')),
    plate: R(plate), plateShown: !!(plate && getComputedStyle(plate).display !== 'none'),
    overlapPx: overlap(R(panel), R(plate)),
    speed: document.getElementById('metaSpeed')?.textContent,
    gear: document.getElementById('metaGear')?.textContent,
  }, null, 1);
})()
