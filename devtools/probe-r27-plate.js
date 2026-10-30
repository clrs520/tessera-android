(() => {
  const els = [...document.querySelectorAll('[id*=stat i],[class*=stats],[id*=detail i],[class*=detail-panel],[id*=plate]')];
  const seen = new Set();
  const out = els.map(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    const k = e.tagName + '#' + e.id + '.' + e.className; if (seen.has(k)) return null; seen.add(k);
    return { tag: e.tagName.toLowerCase(), id: e.id, cls: (e.className||'').toString().slice(0,40),
      disp: cs.display, vis: cs.visibility, op: cs.opacity, z: cs.zIndex,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
  }).filter(Boolean);
  return JSON.stringify(out, null, 1);
})()
