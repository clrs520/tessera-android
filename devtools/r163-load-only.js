// R163 — one cold full load of the 20k tree, long tasks only. No triple scan: the AVD cannot take
// three walks of 20k USB-emulated files back to back without distorting the numbers.
(async () => {
  for (let i = 0; i < 60 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const long = [];
  let obs = null;
  try {
    obs = new PerformanceObserver((list) => { for (const e of list.getEntries()) long.push(Math.round(e.duration)); });
    obs.observe({ entryTypes: ['longtask'] });
  } catch (e) { /* optional */ }
  const t0 = performance.now();
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamBig');
  const ms = Math.round(performance.now() - t0);
  obs?.disconnect();
  return JSON.stringify({
    ms,
    files: v.allFiles.length,
    events: v.eventGroups.length,
    longTasks: long.length,
    longMax: long.length ? Math.max(...long) : 0,
    over50: long.filter(d => d >= 100).length,
    top: long.slice().sort((a, b) => b - a).slice(0, 8),
  });
})()
