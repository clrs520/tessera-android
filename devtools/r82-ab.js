// A/B for R82: same measurement before and after 刷新列表, taken from the page.
// `snap()` is what the user's screen is made of: is there an event, do the six tiles have a source,
// and are 剪辑 / 全屏 reachable.
(() => {
  const v = window.viewer;
  const el = id => document.getElementById(id);
  const snap = () => {
    const vs = [...document.querySelectorAll('video')];
    const clip = el('clipBtn'), fs = el('fullscreenBtn');
    return {
      t: Date.now(),
      event: v.currentEvent ? v.currentEvent.eventId : null,
      seg: v.continuousPlayer ? v.continuousPlayer.currentSegmentIndex : null,
      srcs: vs.filter(x => x.src).length,
      rs: vs.map(x => x.readyState).join(''),
      playing: v.multiCameraPlayer ? v.multiCameraPlayer.isPlaying : null,
      clipDisabled: clip ? clip.disabled : '?', fsDisabled: fs ? fs.disabled : '?',
      clipPE: clip ? getComputedStyle(clip).pointerEvents : '?',
      layout: v.currentLayout, sc: v.isScanning,
      cards: document.querySelectorAll('.video-card').length
    };
  };
  window.__r82ab = { before: null, after: null };
  window.__r82ab.before = snap();
  el('menuRefreshBtn').click();
  const iv = setInterval(() => {
    if (!v.isScanning) { clearInterval(iv); window.__r82ab.after = snap();
      setTimeout(() => { window.__r82ab.afterLate = snap(); }, 4000); }
  }, 400);
  window.__r82ab.kicked = Date.now();
  return { kicked: true, before: window.__r82ab.before };
})();
