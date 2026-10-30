(() => {
  const g = document.querySelector('.video-grid') || document.querySelector('#videoGrid') || document.querySelector('.player-area > div');
  const cells = [...document.querySelectorAll('.camera-container, .video-container')].slice(0, 8).map(c => { const r = c.getBoundingClientRect();
    return { cls: c.className.slice(0, 26), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; });
  const gr = g.getBoundingClientRect(); const gcs = getComputedStyle(g);
  return JSON.stringify({ grid: { cls: g.className, x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height),
      cols: gcs.gridTemplateColumns, rows: gcs.gridTemplateRows, gap: gcs.gap }, cells }, null, 1);
})()
