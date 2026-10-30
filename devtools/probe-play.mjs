(async () => {
  const els = [...document.querySelectorAll('video')].filter(v => v.src);
  els.forEach(v => { v.muted = true; });
  await Promise.all(els.map(v => v.play().catch(e => 'err:' + e.name)));
  const trace = [];
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 500));
    trace.push(els.map(v => v.id.slice(0, 5) + v.currentTime.toFixed(2) + (v.paused ? 'P' : 'p')).join(' '));
  }
  const evLog = (window.__ev && window.__ev.log) ? window.__ev.log.slice(-14) : null;
  return JSON.stringify({
    trace,
    evLog,
    isPlaying: viewer.multiCameraPlayer.isPlaying,
    active: viewer.multiCameraPlayer.activeCamera,
    net: els.map(v => v.id.slice(0, 5) + ':' + v.networkState + '/' + v.readyState).join(' '),
  });
})()
