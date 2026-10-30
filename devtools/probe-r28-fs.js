(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const c = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; };
  const cs = el => getComputedStyle(el);
  const fs = document.getElementById('fullscreenBtn');
  const v = window.viewer;
  const out = {
    vp: [innerWidth, innerHeight],
    fs: fs ? { disp: cs(fs).display, rect: r(fs), center: c(fs), label: fs.textContent.replace(/\s+/g, ' ').trim().slice(0, 20) } : 'missing',
    bodyCls: document.body.className,
    fsActive: document.body.classList.contains('phone-fullscreen'),
    brightness: v ? (v.brightnessLevel !== undefined ? v.brightnessLevel : 'no-field') : 'no-viewer',
    dimLayer: (() => { const d = document.getElementById('brightnessDimLayer') || document.querySelector('.brightness-dim'); return d ? { d: cs(d).display, op: cs(d).opacity } : 'missing'; })(),
    stored: localStorage.getItem('tdashcam.brightness'),
    time: (document.getElementById('videoTimeDisplay') || {}).textContent,
    speed: (document.getElementById('speedBtn') || {}).textContent,
    errs: (window.__tdashcamErrors || []).slice(-3)
  };
  return JSON.stringify(out, null, 1);
})()
