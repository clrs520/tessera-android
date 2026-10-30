(async () => {
  const v = window.viewer;
  const cards = [...document.querySelectorAll('#fileList > *')];
  const box = (el) => { const r = el.getBoundingClientRect(); return { cls: el.className, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: Math.round(r.width), h: Math.round(r.height), vis: r.width>0 && r.height>0 }; };
  return JSON.stringify({ collapsed: v.dom.sidebar.classList.contains('collapsed'), iw: innerWidth, ih: innerHeight,
    first3: cards.slice(0,3).map(box), dpr: devicePixelRatio });
})()
