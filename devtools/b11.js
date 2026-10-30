(() => {
  const b = document.getElementById('brightnessRowBtn');
  const lbl = document.getElementById('brightnessRowLabel');
  const panel = b.closest('.phone-more-panel, .more-panel, [id]') ;
  const host = b.parentElement;
  const r = lbl.getBoundingClientRect();
  return JSON.stringify({
    htmlClass: document.documentElement.className,
    bodyClass: document.body.className,
    btnRect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    text: lbl.textContent,
    ellipsised: lbl.scrollWidth > lbl.clientWidth + 1,
    scrollWidth: lbl.scrollWidth, clientWidth: lbl.clientWidth,
    color: getComputedStyle(lbl).color,
    btnVisible: b.offsetParent !== null,
    hostId: host.id, panelId: panel.id,
    level: viewer.brightnessLevel,
  }, null, 2);
})()
