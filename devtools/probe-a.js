(() => {
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
  };
  const bar = document.getElementById('phoneActionBar');
  const cs = bar ? getComputedStyle(bar) : null;
  const ctl = document.querySelector('.video-controls-overlay');
  const clipBtn = document.getElementById('clipBtn');
  const fsBtn = document.querySelector('.fullscreen-btn');
  const at = (x, y) => {
    const e = document.elementFromPoint(x, y);
    return e ? (e.id || e.className || e.tagName) : null;
  };
  const cr = r(clipBtn), fr = r(fsBtn);
  return JSON.stringify({
    fsClass: document.body.classList.contains('phone-fullscreen'),
    playing: !!(window.viewer && viewer.multiCameraPlayer && viewer.multiCameraPlayer.isPlaying),
    barRect: r(bar), barDisp: cs && cs.display, barZ: cs && cs.zIndex,
    ctlRect: r(ctl),
    clipRect: cr, fsRect: fr,
    atClip: cr && at(cr[0] + cr[2] / 2, cr[1] + cr[3] / 2),
    atFs: fr && at(fr[0] + fr[2] / 2, fr[1] + fr[3] / 2),
    atBarCenter: at(200, (bar ? r(bar)[1] + 20 : 0)),
  }, null, 1);
})()
