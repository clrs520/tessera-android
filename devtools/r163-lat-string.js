// R163 — a real stick writes `est_lat` / `est_lon` as strings (3167/3167 in the R157 audit), and
// some event.json files write `timestamp` as epoch seconds. The native sidecar reader must keep
// those values, or `hasPlace` hides the header location and the trigger time is lost.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const inv = window.__TAURI__.core?.invoke || window.__TAURI__.invoke;
  const path = '/storage/emulated/0/TeslaCamLat/SavedClips/2026-07-01_08-00-00/event.json';
  let row = null, directErr = null;
  try {
    const rows = await inv('read_sidecars', { paths: [path] });
    row = Array.isArray(rows) ? rows[0] : null;
  } catch (e) { directErr = String(e && e.message || e); }

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamLat');
  for (let i = 0; i < 120 && (v.eventGroups || []).length !== 1; i++) await sleep(100);
  const ev = (v.eventGroups || [])[0];
  if (ev) await v.playEvent(ev.eventId);
  for (let i = 0; i < 80 && v.currentEvent?.eventId !== ev?.eventId; i++) await sleep(100);
  await sleep(300);
  const loc = document.getElementById('headerLocationDisplay');
  return JSON.stringify({
    directErr,
    direct: row && { ok: row.ok, lat: row.lat, lon: row.lon, timestamp: row.timestamp },
    event: ev && { lat: ev.lat, lon: ev.lon, timestamp: ev.eventTimestamp, city: ev.city, street: ev.street },
    header: loc && { display: getComputedStyle(loc).display, text: loc.textContent.trim() },
  });
})()
