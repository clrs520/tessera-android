(() => {
  const pts = [[600,150],[457,150],[200,150],[600,250],[457,250],[750,250],[457,110]];
  const hit = pts.map(([x,y]) => { const e = document.elementFromPoint(x,y);
    return { p: [x,y], el: e ? e.tagName + '#' + e.id + '.' + (e.className||'').toString().trim().split(/\s+/).slice(0,2).join('.') : null }; });
  const v = document.querySelector('video');
  return JSON.stringify({ hit, paused: v.paused, playing: window.viewer?.videoControls?.isPlaying,
    overlayCls: document.querySelector('.video-controls-overlay').className }, null, 1);
})()
