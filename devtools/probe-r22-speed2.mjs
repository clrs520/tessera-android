(() => {
  const opts = document.querySelector('.speed-options');
  const b = opts.getBoundingClientRect();
  const rows = [...opts.querySelectorAll('div')].map(r => {
    const q = r.getBoundingClientRect();
    const hit = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2);
    return `${(r.textContent||'').trim()}@${Math.round(q.y)}→${hit === r ? 'self' : (hit?.className || hit?.tagName || 'null')}`;
  });
  const bar = document.querySelector('.progress-container, .progress-bar')?.getBoundingClientRect();
  return JSON.stringify({ open: getComputedStyle(opts).display, menu: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)],
    offRight: Math.round(b.right - innerWidth), rows, barTop: bar ? Math.round(bar.top) : null,
    overlayZ: getComputedStyle(document.querySelector('.video-controls-overlay')).zIndex });
})()
