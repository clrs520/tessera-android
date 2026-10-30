// Snapshot of the playing state on the installed build: does the drawer undock, does the
// overlay still fade on its own, and does anything drag the header/bars down with it? Run via
//   node devtools/cdp-eval.mjs --file devtools/probe-r16-play.mjs
(async () => {
  const out = {};
  const box = el => {
    if (!el) return 'absent';
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`;
  };
  const cs = (el, ...props) => {
    if (!el) return 'absent';
    const s = getComputedStyle(el);
    return props.map(p => `${p}=${s[p]}`).join(' ');
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const snap = tag => {
    const header = document.querySelector('.main-header');
    const bar = document.getElementById('phoneActionBar');
    const overlay = document.querySelector('.video-controls-overlay');
    out[tag] = {
      body: document.body.className,
      overlayShown: overlay.classList.contains('show'),
      overlay: cs(overlay, 'opacity', 'display'),
      header: cs(header, 'opacity', 'position', 'pointerEvents'),
      bar: cs(bar, 'opacity', 'pointerEvents'),
      zoomOutBtn: cs(document.querySelector('.camera-zoom-out-btn'), 'opacity', 'display'),
      home: document.body.classList.contains('phone-list-home'),
      immersive: document.body.classList.contains('immersive'),
      videos: Array.from(document.querySelectorAll('video')).map(v => `${v.paused ? 'P' : '▶'}${Math.round(v.currentTime)}`).join(','),
      controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h'),
      actionH: getComputedStyle(document.documentElement).getPropertyValue('--action-h'),
      layout: document.querySelector('.player-area').className,
    };
  };

  snap('now');
  // The auto-hide timer is 3s; sample well past it.
  await wait(4800);
  snap('afterFade');
  out.verdict = {
    faded: out.now.overlayShown && !out.afterFade.overlayShown,
    noImmersive: !out.afterFade.immersive,
    chromeStillThere: out.afterFade.header.includes('opacity=1') &&
        out.afterFade.bar.includes('opacity=1') && !out.afterFade.header.includes('position=absolute'),
  };
  return JSON.stringify(out, null, 1);
})()
