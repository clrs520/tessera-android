(async () => {
  const v = window.viewer;
  v.lastScanSignature = null;
  const ok = await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  return JSON.stringify({ ok, groups: v.eventGroups.length,
    roots: [...new Set(v.eventGroups.map(g => g.eventId.split('/')[0]))],
    foreign: v.allFiles.filter(f => (f.path || '').includes('TeslaCamRace')).length,
    lastScannedPath: v.lastScannedPath });
})()
