(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const cs = el => getComputedStyle(el);
  const hud = document.getElementById('metadataPanel');
  const plate = document.getElementById('metaDetailOverlay');
  const mm = window.viewer && window.viewer.metadataManager;
  return JSON.stringify({
    hud: hud ? { cls: hud.className, d: cs(hud).display, op: cs(hud).opacity, rect: r(hud), txt: hud.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) } : 'missing',
    plate: plate ? { cls: plate.className, d: cs(plate).display, rect: r(plate) } : 'missing',
    userPinned: mm ? mm.userPinned : 'no-mm',
    emptyPlace: mm && mm.dom.emptyPlace ? mm.dom.emptyPlace.textContent : null,
    btnCls: document.getElementById('metaSwitchBtn') ? document.getElementById('metaSwitchBtn').className : null,
  }, null, 1);
})()
