(async () => {
  const v = window.viewer;
  if (!v) return 'no viewer';
  const BIG = '/storage/emulated/0/TeslaCam';
  const RACE = '/storage/emulated/0/TeslaCamRace';
  const snap = (t) => ({ t, lastScannedPath: v.lastScannedPath, groups: v.eventGroups.length,
    roots: [...new Set(v.eventGroups.map(g => g.eventId.split('/')[0]))],
    fileRoots: [...new Set(v.allFiles.map(f => (f.path || '').split('/').slice(0, 4).join('/')))] });

  v.lastScanSignature = null;                       // force a real rebuild (the fingerprint guard)
  await v.loadTauriDirectory(RACE);
  const loadedRace = snap('RACE-loaded');
  const ev = v.eventGroups[0];
  const targets = v.allFiles.map(f => f.path);
  v.pendingDelete = { event: ev, targets };
  await v.confirmDeleteEvent();                     // card leaves; nothing unlinked inside the window
  const job = v.pendingDeleteUndo;
  clearTimeout(job.timer);                           // never unlink, for this probe
  job.timer = setTimeout(() => {}, 60000);          // keep the job addressable but inert

  v.lastScanSignature = null;
  await v.loadTauriDirectory(BIG);                  // switch drive; nothing flushes the pending job
  const afterSwitch = snap('after-switch-to-BIG');

  v.undoDelete(job);                                // user taps 撤销
  await new Promise(r => setTimeout(r, 400));
  const afterUndo = snap('after-undo-in-other-folder');
  v.pendingDeleteUndo = null;
  return JSON.stringify({ loadedRace, afterSwitch, afterUndo,
    foreignCards: v.eventGroups.filter(g => g.eventId.startsWith('TeslaCamRace')).length,
    foreignFiles: v.allFiles.filter(f => (f.path || '').includes('TeslaCamRace')).length,
    contaminated: v.eventGroups.some(g => g.eventId.startsWith('TeslaCamRace')) }, null, 1);
})()
