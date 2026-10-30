(async () => {
  const v = window.viewer;
  v.lastScanSignature = null;
  const ok = await v.loadTauriDirectory('/storage/emulated/0/TeslaCamRace');
  return JSON.stringify({ ok, groups: v.eventGroups.length, files: v.allFiles.length,
    paths: v.allFiles.slice(0, 2).map(f => f.path), token: v.scanToken, scanning: v.isScanning,
    toast: (document.querySelector('.toast') || {}).textContent || null });
})()
