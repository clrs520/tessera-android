(() => {
  const c = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; };
  const segs = [...document.querySelectorAll('#themeChoice .choice-segment')].map(el => [el.textContent.trim(), ...c(el), el.classList.contains('on')]);
  return JSON.stringify({ open: document.getElementById('headerRight').classList.contains('active'), segs, theme: document.body.classList.contains('dark-theme')?'dark':'light' });
})()
