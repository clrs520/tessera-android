(async () => {
  const v = window.viewer;
  const paths = ['/storage/emulated/0/Download/TeslaCam-2', '/sdcard/Movies/TeslaCam', '/storage/0000-0000/TeslaCam'];
  const out = [];
  for (const p of paths) {
    let scan = null;
    try { const f = await v.nativeScanFiles(p); scan = { ok: f.length }; }
    catch (e) { scan = { threw: String(e && e.message || e).slice(0, 160) }; }
    const gone = await v.scannedPathGone(p);
    out.push({ p, scan, scannedPathGone: gone });
  }
  return JSON.stringify(out, null, 1);
})()
