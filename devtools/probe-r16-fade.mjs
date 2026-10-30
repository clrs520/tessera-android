// Does playback still fade the overlay without dragging the header/system bars into an
// "auto-fullscreen" with it? Run via
//   node devtools/cdp-eval.mjs --file devtools/probe-r16-fade.mjs
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
      overlay: cs(overlay, 'opacity', 'display') + ' ' + box(overlay),
      header: cs(header, 'opacity', 'position', 'pointerEvents') + ' ' + box(header),
      bar: cs(bar, 'opacity', 'display', 'pointerEvents') + ' ' + box(bar),
      immersive: document.body.classList.contains('immersive'),
      home: document.body.classList.contains('phone-list-home'),
      player: box(document.getElementById('playerArea')),
      controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h'),
    };
  };

  snap('before');
  const card = document.querySelector('.video-card');
  out.card = card ? box(card) : 'absent';
  if (!card) return JSON.stringify(out, null, 1);
  card.click();
  await wait(2500);
  snap('afterTap');
  out.videoCount = document.querySelectorAll('.camera-feed video, video').length;
  out.currentTime = Array.from(document.querySelectorAll('video')).map(v => `${v.paused ? 'paused' : 'playing'}:${Math.round(v.currentTime)}`);

  // The auto-hide timer is 3s; sample past it.
  await wait(4500);
  snap('afterFade');
  out.sysBars = 'see dumpsys';

  // A tap while faded should wake the controls and NOT zoom the feed under the finger.
  const before = document.querySelector('.player-area').className;
  document.getElementById('front-player')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await wait(300);
  out.tapWhileFaded = {
    layoutBefore: before,
    layoutAfter: document.querySelector('.player-area').className,
    overlay: cs(document.querySelector('.video-controls-overlay'), 'opacity'),
    zoomed: document.body.classList.contains('camera-zoomed'),
  };
  return JSON.stringify(out, null, 1);
})()
