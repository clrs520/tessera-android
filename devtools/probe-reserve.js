(() => {
  const out = {};
  const r = (e) => { const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
  const pa = document.querySelector('#playerArea');
  const ov = document.querySelector('.video-controls-overlay');
  for (const v of ['grid', 'grid4']) {
    document.querySelector(`.view-btn[data-view="${v}"]`).click();
    void pa.offsetWidth;
    const cells = [...document.querySelectorAll('.video-container:not(.hidden)')].map(e => e.getBoundingClientRect());
    const o = ov.getBoundingClientRect();
    const cs = getComputedStyle(pa);
    out[v] = {
      controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h').trim(),
      reserve: cs.paddingBottom,
      overlay: r(ov),
      lowestCellBottom: Math.round(Math.max(...cells.map(b => b.bottom))),
      overlapPx: Math.round(Math.max(...cells.map(b => b.bottom)) - o.top),
      cellSize: `${Math.round(cells[0].width)}x${Math.round(cells[0].height)}`,
      cellAspect: (cells[0].width / cells[0].height).toFixed(2),
    };
  }
  out.viewport = { w: innerWidth, h: innerHeight };
  out.safe = {
    bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom').trim(),
  };
  out.targets = {
    controlBtn: Math.round(document.querySelector('#playPauseBtn').getBoundingClientRect().height),
    viewBtn: [Math.round(document.querySelector('.view-btn').getBoundingClientRect().width), Math.round(document.querySelector('.view-btn').getBoundingClientRect().height)],
    openSidebar: Math.round(document.querySelector('#openSidebarBtn').getBoundingClientRect().height),
  };
  return JSON.stringify(out, null, 2);
})()
