// R82 instrumentation: who calls the storage commands, how long the round trip takes, and whether
// the JS main thread is the thing that is stuck (rAF gaps + long tasks) or the Rust side.
(() => {
  window.__r82inv = [];
  window.__r82err = [];
  window.__r82frames = [];
  window.__r82long = [];
  if (!window.__r82origInvoke) window.__r82origInvoke = window.nativeInvoke;
  const orig = window.__r82origInvoke;
  window.nativeInvoke = function (cmd, args) {
    const rec = { cmd, t0: Date.now(), path: args && args.path,
      stack: (new Error().stack || '').split('\n').slice(2, 6).map(s => s.trim().replace(/^at\s+/, '').slice(0, 70)).join(' < ') };
    window.__r82inv.push(rec);
    let p;
    try { p = orig(cmd, args); } catch (e) { rec.syncThrow = String(e); throw e; }
    if (!p || typeof p.then !== 'function') { rec.notThenable = true; return p; }
    return p.then(v => { rec.t1 = Date.now(); rec.ms = rec.t1 - rec.t0; rec.ok = true; return v; },
                 e => { rec.t1 = Date.now(); rec.ms = rec.t1 - rec.t0; rec.err = String(e && e.message || e).slice(0, 90); throw e; });
  };
  if (!window.__r82errArm) {
    window.__r82errArm = true;
    window.addEventListener('error', e => window.__r82err.push({ k: 'err', m: String(e.message).slice(0, 120), l: e.lineno, t: Date.now() }));
    window.addEventListener('unhandledrejection', e => window.__r82err.push({ k: 'rej', m: String(e.reason && e.reason.message || e.reason).slice(0, 120), t: Date.now() }));
  }
  // rAF ticker: a stall here means the renderer main thread could not run, whatever Rust was doing.
  if (window.__r82raf) cancelAnimationFrame(window.__r82raf.id);
  (function tick() {
    const t = Date.now();
    const a = window.__r82frames;
    if (a.length && t - a[a.length - 1] > 700) a.push({ gap: t - a[a.length - 1], t });
    a.push({ t });
    if (a.length > 3000) a.splice(0, 1500);
    window.__r82raf = { id: requestAnimationFrame(tick) };
  })();
  try {
    window.__r82po = new PerformanceObserver(l => { for (const e of l.getEntries()) window.__r82long.push({ d: Math.round(e.duration), t: Math.round(e.startTime) }); });
    window.__r82po.observe({ entryTypes: ['longtask'] });
  } catch (e) { window.__r82long.push({ unsupported: String(e).slice(0, 60) }); }
  return { armed: true, raf: 'running', longtask: !window.__r82po ? 'unsupported' : 'observing' };
})();
