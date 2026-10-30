(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const header = document.querySelector('.main-header');
  const actives = [...header.querySelectorAll('.active')].map(e => ({ tag: e.tagName, id: e.id, cls: (e.className || '').toString().slice(0, 50), rect: r(e) }));
  const chain = [];
  let el = document.getElementById('headerActionsGroup');
  while (el && el !== document.body) {
    const s = getComputedStyle(el);
    chain.push({ tag: el.tagName, id: el.id, cls: (el.className || '').toString().slice(0, 44), z: s.zIndex, pos: s.position, rect: r(el) });
    el = el.parentElement;
  }
  return JSON.stringify({ actives, chain, hrCount: document.querySelectorAll('.header-right').length, hrList: [...document.querySelectorAll('.header-right')].map(e => ({ id: e.id, cls: e.className, rect: r(e) })) }, null, 1);
})()
