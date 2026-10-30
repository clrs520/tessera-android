(() => {
  const b = document.getElementById('fullscreenBtn');
  const r = b.getBoundingClientRect(); const cs = getComputedStyle(b);
  const cx = r.x + r.width/2, cy = r.y + r.height/2;
  const top = document.elementFromPoint(cx, cy);
  const ok = cs.visibility === 'visible' && (top === b || b.contains(top));
  return JSON.stringify({ ok, vis: cs.visibility, x: Math.round(cx), y: Math.round(cy),
    top: top ? top.tagName + '#' + top.id + '.' + (top.className||'').toString().slice(0,24) : null });
})()
