(() => {
  const info = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top),
      disp: cs.display, vis: cs.visibility, op: cs.opacity, color: cs.color, fill: cs.fill, stroke: cs.stroke, cls: el.getAttribute('class') };
  };
  const btn = document.getElementById('fullscreenBtn');
  return JSON.stringify({
    btn: info(btn),
    btnCls: btn && btn.className,
    btnHTML: btn && btn.innerHTML.replace(/\s+/g, ' ').slice(0, 120),
    expand: info(document.querySelector('#fullscreenBtn .fs-expand')),
    collapse: info(document.querySelector('#fullscreenBtn .fs-collapse')),
    clip: info(document.getElementById('clipBtn')),
    clipSvg: info(document.querySelector('#clipBtn svg')),
    speedBtn: info(document.getElementById('speedBtn')),
    fsParent: btn && info(btn.parentElement),
    phoneFs: document.body.classList.contains('phone-fullscreen'),
  }, null, 1);
})();
