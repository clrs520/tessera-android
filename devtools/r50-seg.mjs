(() => {
  const box = document.getElementById('tapBehaviorChoice');
  const segs = [...box.querySelectorAll('button, [data-tap-behavior], .segment')].map(el => {
    const r = el.getBoundingClientRect();
    return [el.textContent.trim(), Math.round(r.left+r.width/2), Math.round(r.top+r.height/2), el.className];
  });
  return JSON.stringify({ open: document.getElementById('headerRight').classList.contains('active'), segs });
})()
