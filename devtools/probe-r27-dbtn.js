(() => {
  const b = document.getElementById('metaDetailBtn');
  const r = b.getBoundingClientRect(); const cs = getComputedStyle(b);
  const top = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
  return JSON.stringify({ rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    disabled: b.disabled, vis: cs.visibility, op: cs.opacity, pe: cs.pointerEvents,
    topEl: top ? top.tagName + '#' + top.id + '.' + (top.className||'').toString().slice(0,30) : null });
})()
