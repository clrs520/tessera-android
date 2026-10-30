(() => {
  const out = [];
  for (const e of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const z = parseInt(cs.zIndex, 10);
    if (!(cs.position === 'fixed' || cs.position === 'absolute' || (cs.position === 'static' && false))) continue;
    if (!(z >= 800 || !isNaN(z) && z >= 800)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) continue;
    out.push({ tag: e.tagName.toLowerCase(), id: e.id, cls: (e.className||'').toString().slice(0,44), z,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      kids: e.querySelectorAll('button').length });
  }
  return JSON.stringify(out, null, 1);
})()
