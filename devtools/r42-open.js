(() => {
  const hr = document.querySelector('.header-right');
  const r = document.getElementById('themeChoice').getBoundingClientRect();
  return JSON.stringify({
    active: hr ? hr.className : null,
    themeRow: {top: Math.round(r.top), h: Math.round(r.height)},
    lightSegCenterDevice: (() => { const s = document.querySelector('#themeChoice .choice-segment[data-mode="light"]'); const q = s.getBoundingClientRect(); return [Math.round((q.left+q.width/2)*devicePixelRatio), Math.round((q.top+q.height/2)*devicePixelRatio)]; })(),
  });
})()
