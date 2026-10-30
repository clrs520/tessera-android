(() => {
  const ids = ['.view-btn', '#fullscreenBtn', '#clipBtn', '#playPauseBtn', '#tabLayoutBtn', '#tabMoreBtn', '#speedBtn'];
  const out = {};
  for (const sel of ids) {
    const el = document.querySelector(sel);
    if (!el) { out[sel] = 'missing'; continue; }
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const bar = el.closest('.video-controls, .bottom-bar, #phoneActionBar, .player-controls');
    out[sel] = { pe: cs.pointerEvents, op: cs.opacity, vis: cs.visibility, disp: cs.display,
      h: Math.round(r.height), barCls: bar ? bar.className.slice(0, 40) : null,
      barPE: bar ? getComputedStyle(bar).pointerEvents : null, barOp: bar ? getComputedStyle(bar).opacity : null };
  }
  out._sc = window.viewer.isScanning;
  out._sk = document.querySelectorAll('.scan-skeleton').length;
  out._t = Date.now();
  return out;
})();
