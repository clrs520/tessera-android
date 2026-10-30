// R68 verification: sample panel shape at 30ms for 12s, record every distinct shape with
// its start/stop time and the inline/computed edges that produced it, plus resize marks.
window.__hudEv = [];
(() => {
  const p = document.getElementById('metadataPanel');
  if (!p) return 'NO_PANEL';
  const t0 = performance.now();
  const out = window.__hudEv;
  let cur = null;
  const fmt = (v) => String(v).replace(/\s+/g, ' ').trim();
  const snap = () => {
    const r = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    const key = [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.top)].join('x');
    if (key !== (cur && cur.key)) {
      if (cur) cur.end = Math.round(performance.now() - t0);
      cur = { key, start: out.length ? NaN : 0, end: null,
              style: fmt(p.getAttribute('style')), cls: p.className,
              pos: `${cs.position} t=${cs.top} l=${cs.left} r=${cs.right} b=${cs.bottom}`,
              mqn: [matchMedia('(orientation: landscape) and (max-height: 620px) and (max-width: 1200px)').matches,
                    matchMedia('(max-width: 768px)').matches,
                    matchMedia('(orientation: portrait)').matches].join(''),
              vw: window.innerWidth + 'x' + window.innerHeight };
      out.push(cur);
    }
    if (out.length > 400) return;
  };
  const loop = () => {
    snap();
    if (performance.now() - t0 < 12000) requestAnimationFrame(loop);
    else if (cur) cur.end = Math.round(performance.now() - t0);
  };
  requestAnimationFrame(loop);
  window.addEventListener('resize', () => out.push(['resize', Math.round(performance.now() - t0), window.innerWidth + 'x' + window.innerHeight]));
  return 'ARMED ' + window.innerWidth + 'x' + window.innerHeight;
})()
