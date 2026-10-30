(() => {
  const R = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
  };
  const plate = R('.stats-overlay');
  const arts = [...document.querySelectorAll('video')]
    .filter(v => v.getBoundingClientRect().width > 0)
    .map((v) => {
      const b = v.getBoundingClientRect();
      if (!v.videoWidth) return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
      const sc = Math.min(b.width / v.videoWidth, b.height / v.videoHeight);
      const w = v.videoWidth * sc, h = v.videoHeight * sc;
      return [Math.round(b.x + (b.width - w) / 2), Math.round(b.y + (b.height - h) / 2), Math.round(w), Math.round(h)];
    });
  const artTop = arts.length ? Math.min(...arts.map(a => a[1])) : null;
  const artBottom = arts.length ? Math.max(...arts.map(a => a[1] + a[3])) : null;
  return JSON.stringify({
    vw: innerWidth, vh: innerHeight,
    plate, artTop, artBottom,
    player: R('.player-area'),
    overlay: R('.video-controls-overlay'),
    actionBar: R('#phoneActionBar'),
    grid: R('.multi-camera-grid, #multiCameraGrid, .camera-grid'),
    layout: (document.querySelector('#tabLayoutLabel') || {}).textContent,
  }, null, 1);
})()
