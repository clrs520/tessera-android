// R163 — the scan's relative path is now handed to TauriFile instead of rebuilt per file; the
// result must be the same string the desktop path and every event-grouping consumer expect.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const root = '/storage/emulated/0/TeslaCamBig';
  const t0 = performance.now();
  const files = await v.nativeScanFiles(root);
  const ms = Math.round(performance.now() - t0);
  const check = (f) => ({
    path: f.path,
    rel: f.webkitRelativePath,
    ok: f.webkitRelativePath === 'TeslaCamBig/' + f.path.slice(root.length + 1),
    size: typeof f.size,
    duration: typeof f.duration,
  });
  const sample = [0, 1, Math.floor(files.length / 2), files.length - 2, files.length - 1]
    .filter(i => i >= 0 && i < files.length).map(i => check(files[i]));
  return JSON.stringify({
    ms,
    count: files.length,
    allRelative: files.every(f => f.webkitRelativePath.startsWith('TeslaCamBig/')),
    allPaths: files.every(f => f.path.startsWith(root + '/')),
    sample,
  });
})()
