(() => {
  const chain = [];
  let e = document.getElementById('headerActionsGroup');
  while (e && e !== document.documentElement) {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    chain.push({ tag: e.tagName.toLowerCase(), id: e.id, cls: (e.className||'').toString().slice(0,50),
      pos: cs.position, z: cs.zIndex, disp: cs.display,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } });
    e = e.parentElement;
  }
  const hr = document.getElementById('headerRight');
  return JSON.stringify({ chain, headerRight: hr ? { cls: hr.className, disp: getComputedStyle(hr).display,
    rect: (r => ({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(hr.getBoundingClientRect()) } : null }, null, 1);
})()
