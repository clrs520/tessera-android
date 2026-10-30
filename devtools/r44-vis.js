(() => {
    const p = document.querySelector('.header-collapsed .header-actions-group');
    if (!p) return JSON.stringify({present: false});
    const cs = getComputedStyle(p);
    const r = p.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + 10, r.y + 10);
    return JSON.stringify({present: true, display: cs.display, visibility: cs.visibility, opacity: cs.opacity, rect: [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)], hitClass: hit ? hit.className : null});
})()
