(() => {
  const o = document.querySelector('.video-controls-overlay');
  const cs = o ? getComputedStyle(o) : null;
  const r = o ? o.getBoundingClientRect() : null;
  return JSON.stringify({
    bodyClass: document.body.className,
    mainClass: document.getElementById('mainContent')?.className,
    layout: window.viewer?.currentLayout || window.viewer?.layoutMode || null,
    overlay: o ? { cls: o.className, op: cs.opacity, vis: cs.visibility, disp: cs.display, pe: cs.pointerEvents,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } } : null,
    controlsWrap: (() => { const c = document.querySelector('.video-controls'); if (!c) return null; const s = getComputedStyle(c); const q = c.getBoundingClientRect();
      return { cls: c.className, disp: s.display, vis: s.visibility, rect: { x: Math.round(q.x), y: Math.round(q.y), w: Math.round(q.width), h: Math.round(q.height) } }; })(),
  }, null, 1);
})()
