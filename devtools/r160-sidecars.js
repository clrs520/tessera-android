// R160 — sidecars must be read in one native batch, with the same fields and failure accounting
// as the JS path. Runs before the command exists (red) and after wiring (green).
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { direct: null, wiring: null, harness: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }
  const root = '/storage/emulated/0/TeslaCamSidecars';
  const dirs = ['2026-02-01_08-00-00', '2026-02-02_08-00-00', '2026-02-03_08-00-00', '2026-02-04_08-00-00'];
  const paths = dirs.map(d => `${root}/SavedClips/${d}/event.json`);

  const tauri = window.__TAURI__;
  const invoke = tauri.core?.invoke || tauri.invoke;
  try {
    const rows = await invoke('read_sidecars', { paths });
    out.direct = {
      count: Array.isArray(rows) ? rows.length : null,
      rows: Array.isArray(rows) ? rows.map(r => ({ ok: r.ok, city: r.city, street: r.street,
        lat: r.lat, lon: r.lon, reason: r.reason, timestamp: r.timestamp })) : rows,
    };
  } catch (e) {
    out.direct = { err: String(e && e.message || e) };
  }

  await v.loadTauriDirectory(root);
  for (let i = 0; i < 120 && (v.eventGroups || []).length !== 4; i++) await sleep(100);
  const find = (day) => (v.eventGroups || []).find(e => String(e.startTime).startsWith(day));
  const e1 = find('2026-02-01');
  out.wiring = {
    events: (v.eventGroups || []).length,
    source: v.lastSidecarSource || null,
    city: e1 && e1.city,
    street: e1 && e1.street,
    lat: e1 && e1.lat,
    lon: e1 && e1.lon,
    reason: e1 && e1.reason,
    eventTimestamp: e1 && e1.eventTimestamp,
    failures: v.sidecarFailures || 0,
  };
  return JSON.stringify(out);
})()
