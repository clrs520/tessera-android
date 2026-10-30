(() => {
  const id = (window.__r143target || 'openSidebarBtn');
  const el = document.getElementById(id);
  if (!el) return JSON.stringify({ error: 'no ' + id });
  const r = el.getBoundingClientRect();
  return JSON.stringify({ id, x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
    w: Math.round(r.width), h: Math.round(r.height) });
})()
