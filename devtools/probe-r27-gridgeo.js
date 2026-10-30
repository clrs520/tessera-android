(() => {
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const pa = document.getElementById('playerArea');
  const grid = pa.querySelector('.camera-grid') || pa.firstElementChild;
  const cells = [...pa.querySelectorAll('.video-container, .camera-cell, [class*=container]')].slice(0, 8);
  const gs = getComputedStyle(grid || pa);
  return JSON.stringify({
    vp: [innerWidth, innerHeight],
    player: { rect: r(pa), cls: pa.className },
    grid: grid ? { cls: (grid.className || '').toString(), rect: r(grid), display: gs.display, cols: gs.gridTemplateColumns, rows: gs.gridTemplateRows, gap: gs.gap, align: gs.alignContent, just: gs.justifyContent, maxH: gs.maxHeight, h: gs.height } : null,
    cells: cells.map(c => { const s = getComputedStyle(c); const rr = c.getBoundingClientRect(); return { cls: (c.className || '').toString().slice(0, 26), rect: { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) }, ar: s.aspectRatio, maxH: s.maxHeight, maxW: s.maxWidth, flex: s.flex }; }),
    videoBox: (() => { const v = document.getElementById('front-player'); if (!v) return null; const s = getComputedStyle(v); return { rect: r(v), ar: s.aspectRatio, w: s.width, h: s.height, fit: s.objectFit }; })(),
    deadBelow: (() => { const cs = [...pa.querySelectorAll('.video-container')]; if (!cs.length) return null; const b = Math.max(...cs.map(c => c.getBoundingClientRect().bottom)); const pb = pa.getBoundingClientRect(); return { playerBottom: Math.round(pb.bottom), lastCellBottom: Math.round(b), gap: Math.round(pb.bottom - b) }; })(),
  }, null, 1);
})()
