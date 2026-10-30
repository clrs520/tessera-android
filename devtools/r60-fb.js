(() => {
  const v = window.viewer;
  const cell = document.querySelector('.video-container');
  const vid = cell?.querySelector('video');
  const so = document.querySelector('.stats-overlay');
  const g = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  return JSON.stringify({
    ev: v.currentEvent?.eventId?.split('/').pop() || null,
    bright: v.brightnessLevel != null ? +v.brightnessLevel.toFixed(3) : null,
    rate: vid ? vid.playbackRate : null,
    zoom: Object.keys(v.feedZoom || {}).length,
    tf: vid ? getComputedStyle(vid).transform : null,
    tx: vid ? getComputedStyle(vid).transform : null,
    fingers: v.pictureFingers?.size ?? null,
    stats: g(so), statsDisp: so ? getComputedStyle(so).display : null,
    sheet: document.querySelector('.metadata-panel')?.className || null,
    sidebar: document.querySelector('.sidebar')?.className || null,
    zoomedBody: document.body.classList.contains('camera-zoomed'),
    ctx: document.querySelector('.context-menu, #contextMenu') ? getComputedStyle(document.querySelector('.context-menu, #contextMenu')).display : null,
    err: window.__lastJsError || null,
  });
})()
