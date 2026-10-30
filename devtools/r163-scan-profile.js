// R163 — where the wait and the jank actually are on a 20k-file tree. The native walk is off the
// UI thread, so the interesting questions are the IPC payload, the 20k TauriFile mapping and the
// synchronous grouping afterwards. ES2019+ is fine here (API 36 WebView).
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const inv = window.__TAURI__.core?.invoke || window.__TAURI__.invoke;
  const long = [];
  let observer = null;
  try {
    observer = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) long.push(Math.round(e.duration));
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) { /* not available */ }
  const t = async (fn) => { const s = performance.now(); const value = await fn(); return [Math.round(performance.now() - s), value]; };

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  long.length = 0;

  const [rawMs, report] = await t(() => inv('scan_media_dir', { path: '/storage/emulated/0/TeslaCamBig' }));
  const rawFiles = Array.isArray(report?.files) ? report.files.length : null;

  const [mapMs, files] = await t(() => v.nativeScanFiles('/storage/emulated/0/TeslaCamBig'));
  const [groupMs, events] = await t(() => v.processFiles(files, { reuseSidecars: true }));

  const [loadMs] = await t(() => v.loadTauriDirectory('/storage/emulated/0/TeslaCamBig'));
  observer?.disconnect();
  return JSON.stringify({
    rawMs,
    rawFiles,
    mapMs,
    files: files.length,
    firstRelative: files[0]?.webkitRelativePath,
    groupMs,
    events: events.length,
    loadMs,
    groupsFinal: v.eventGroups.length,
    longTasks: long,
    longCount: long.length,
    longMax: long.length ? Math.max(...long) : 0,
  });
})()
