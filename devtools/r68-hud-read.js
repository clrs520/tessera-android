// Collapse the frame trace into the shape sequence: one entry per change of
// (panel size | matched queries | classes | flex-direction), with the frames that agree merged.
(() => {
  const trace = window.__hudTrace || [];
  const marks = window.__hudMarks || [];
  if (!trace.length) return JSON.stringify({ err: 'no samples yet' });
  const key = (s) => `${s.panel[0]}x${s.panel[1]}|${s.mqn}|${s.cls}|${s.fd}|${s.maxw}|${s.pos}|${s.inline}`;
  const out = [];
  let run = null;
  for (const s of trace) {
    const k = key(s);
    if (!run || k !== run.k) {
      run = { k, from: s.t, to: s.t, n: 1, s };
      out.push(run);
    } else { run.to = s.t; run.n++; }
  }
  return JSON.stringify({
    frames: trace.length,
    spanMs: trace[trace.length - 1].t,
    marks,
    shapes: out.map(r => ({
      t: r.from, to: r.to, n: r.n,
      panel: r.s.panel, vw: `${r.s.vw}x${r.s.vh}`, dpr: r.s.dpr,
      mqn: r.s.mqn, cls: r.s.cls, fd: r.s.fd, maxw: r.s.maxw, pos: r.s.pos,
      inline: r.s.inline, items: r.s.items, vis: r.s.vis
    }))
  }, null, 1);
})()
