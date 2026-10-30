// R160 — how long the list waits for 300 sidecars. Same tree and same device before/after moving
// the reads to one native call; the scan itself is native in both builds.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ err: 'no viewer' });
  await v.setRecentSplit('none');
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  const t0 = performance.now();
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamMany');
  const ms = Math.round(performance.now() - t0);
  const e = (v.eventGroups || [])[0];
  const jsons = (v.allFiles || []).filter(f => f.name === 'event.json');
  let nativeMs = null, nativeCount = null, nativeErr = null;
  try {
    const t1 = performance.now();
    const rows = await (window.__TAURI__.core?.invoke || window.__TAURI__.invoke)('read_sidecars', { paths: jsons.map(f => f.path) });
    nativeMs = Math.round(performance.now() - t1);
    nativeCount = Array.isArray(rows) ? rows.length : null;
  } catch (err) { nativeErr = String(err && err.message || err); }
  return JSON.stringify({
    loadMs: ms,
    events: (v.eventGroups || []).length,
    sidecars: jsons.length,
    source: v.lastSidecarSource || null,
    firstCity: e && e.city,
    failures: v.sidecarFailures ?? null,
    nativeMs, nativeCount, nativeErr,
  });
})()
