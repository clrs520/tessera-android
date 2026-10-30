// R68: how long is the stretched state actually visible? Record every geometry change plus the
// resize mark for 30s so the answer is a duration, not a guess.
(() => {
  const p = document.getElementById('metadataPanel');
  if (!p) return 'NO_PANEL';
  const t0 = performance.now();
  const ev = [];
  let last = '';
  window.addEventListener('resize', () => ev.push(['resize', Math.round(performance.now() - t0), innerWidth + 'x' + innerHeight]));
  const sample = () => {
    const r = p.getBoundingClientRect();
    const rec = [Math.round(performance.now() - t0), Math.round(r.height), Math.round(r.width), p.style.top || '-'];
    const k = rec.slice(1).join('|');
    if (k !== last) { ev.push(['geo'].concat(rec)); last = k; }
  };
  const id = setInterval(() => { sample(); if (performance.now() - t0 > 30000) { clearInterval(id); ev.push(['end', Math.round(performance.now() - t0)]); } }, 50);
  window.__hudEv = ev;
  sample();
  return 'REC-ARMED ' + innerWidth + 'x' + innerHeight;
})()
