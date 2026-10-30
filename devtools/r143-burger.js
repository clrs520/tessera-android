(() => {
  const b = document.getElementById('hamburgerBtn') || document.querySelector('.hamburger-btn');
  const r = b ? b.getBoundingClientRect() : null;
  return JSON.stringify({ id: b ? (b.id || b.className) : null,
    x: Math.round(r ? r.x + r.width / 2 : -1), y: Math.round(r ? r.y + r.height / 2 : -1) });
})()
