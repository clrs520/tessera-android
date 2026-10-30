(() => {
  const d = window.devicePixelRatio;
  const out = [...document.querySelectorAll('#recentDirs .recent-chip')].map(c => {
    const r = c.getBoundingClientRect();
    return { path: c.dataset.path, x: Math.round((r.left + r.width / 2) * d), y: Math.round((r.top + r.height / 2) * d), w: Math.round(r.width), on: c.classList.contains('on') };
  });
  const bar = [...document.querySelectorAll('.phone-action-bar button')].map(b => {
    const r = b.getBoundingClientRect();
    return { t: (b.textContent || '').trim().slice(0, 6), x: Math.round((r.left + r.width / 2) * d), y: Math.round((r.top + r.height / 2) * d) };
  });
  return JSON.stringify({ drawerOpen: document.body.classList.contains('sidebar-open') || document.querySelector('.sidebar')?.classList.contains('open'), chips: out, bar }, null, 1);
})()
