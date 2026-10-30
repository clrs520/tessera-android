(() => {
  const v = window.viewer;
  const area = v.dom.playerArea;
  window.__r60t = [];
  let t0 = 0;
  area.addEventListener('pointerdown', (e) => { t0 = performance.now(); }, true);
  area.addEventListener('pointerup', (e) => { window.__r60t.push(Math.round(performance.now() - t0) + 'ms dx=' + Math.round(e.clientX - (window.__r60x||0))); window.__r60x = 0; }, true);
  area.addEventListener('pointerdown', (e) => { window.__r60x = e.clientX; }, true);
  return 'timed';
})()
