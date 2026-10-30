(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const cs = el => getComputedStyle(el);
  const g = document.getElementById('headerActionsGroup');
  const chain = [];
  let p = g;
  while (p && chain.length < 8) {
    const s = cs(p);
    chain.push({ tag: p.tagName, id: p.id, cls: (p.className || '').toString().slice(0, 60), pos: s.position, z: s.zIndex, rect: r(p), ov: s.overflowY });
    p = p.parentElement;
  }
  const btns = [...g.querySelectorAll('button')].map(b => ({ id: b.id, disp: cs(b).display, rect: r(b) }));
  const more = document.getElementById('moreActionsBtn');
  const capsule = document.querySelector('.phone-taskbar, .capsule-bar, #phoneTaskbar, .bottom-capsule');
  return JSON.stringify({
    vp: [innerWidth, innerHeight],
    more: more ? { disp: cs(more).display, rect: r(more), cls: more.className } : null,
    capsule: capsule ? { sel: capsule.selector || capsule.className, id: capsule.id, rect: r(capsule) } : null,
    chain,
    btns,
  }, null, 1);
})()
