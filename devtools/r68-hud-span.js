// R68: duration measurement. rAF is throttled during the rotation animation, so use a timer and
// report when the card first exceeds 120px tall and when the inline top finally disappears.
(() => {
  const p = document.getElementById('metadataPanel');
  if (!p) return 'NO_PANEL';
  window.__hudSpans = [];
  const t0 = performance.now();
  let last = null;
  const id = setInterval(() => {
    const r = p.getBoundingClientRect();
    const rec = {
      t: Math.round(performance.now() - t0),
      h: Math.round(r.height), w: Math.round(r.width),
      top: p.style.top || '-',
      vh: innerHeight
    };
    const k = `${rec.h}|${rec.w}|${rec.top}|${rec.vh}`;
    if (k !== last) { window.__hudSpans.push(rec); last = k; }
    if (rec.t > 9000) { clearInterval(id); window.__hudSpans.push({ t: rec.t, done: 1 }); }
  }, 16);
  return 'TIMER-ARMED ' + innerWidth + 'x' + innerHeight;
})()
