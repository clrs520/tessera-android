(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const c = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; };
  const out = {};
  const bar = document.querySelector('.phone-action-bar, .action-bar, #phoneActionBar, .bottom-action-bar');
  out.barSel = bar ? bar.className || bar.id : null;
  if (bar) out.tabs = [...bar.querySelectorAll('button')].map(b => ({ id: b.id, cls: b.className.slice(0, 40), rect: r(b), center: c(b) }));
  const plate = document.getElementById('metaDetailOverlay');
  out.plate = plate ? { cls: plate.className, rect: r(plate), z: getComputedStyle(plate).zIndex } : null;
  out.vp = [innerWidth, innerHeight];
  return JSON.stringify(out, null, 1);
})()
