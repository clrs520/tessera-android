(() => {
  const h = document.getElementById('metadataPanel');
  const cs = getComputedStyle(h); const r = h.getBoundingClientRect();
  const plate = document.getElementById('metaDetailOverlay');
  const pcs = getComputedStyle(plate); const pr = plate.getBoundingClientRect();
  return JSON.stringify({
    hud: { cls: h.className, disp: cs.display, vis: cs.visibility, op: cs.opacity, z: cs.zIndex,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      inlineStyle: h.getAttribute('style') },
    plate: { cls: plate.className, disp: pcs.display, z: pcs.zIndex,
      rect: { x: Math.round(pr.x), y: Math.round(pr.y), w: Math.round(pr.width), h: Math.round(pr.height) },
      inline: plate.getAttribute('style') },
    overlap: (() => { const w = Math.min(r.right, pr.right) - Math.max(r.left, pr.left);
      const hh = Math.min(r.bottom, pr.bottom) - Math.max(r.top, pr.top); return w > 0 && hh > 0 ? Math.round(w*hh) : 0; })(),
  }, null, 1);
})()
