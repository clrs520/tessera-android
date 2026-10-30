(async () => {
  const v = window.viewer;
  if (!v) return 'no viewer';
  const BIG = '/storage/emulated/0/TeslaCam';
  const SMALL = '/storage/emulated/0/TeslaCamRace';
  const orig = Object.getPrototypeOf(v).handleFolderSelection;
  const snap = (tag) => ({
    tag,
    lastScannedPath: v.lastScannedPath,
    groups: v.eventGroups.length,
    firstEventId: v.eventGroups[0]?.eventId || '',
    firstFileRoot: (v.allFiles[0]?.path || '').split('/').slice(0, 4).join('/'),
    signature: v.lastScanSignature ? v.lastScanSignature.path : null,
    isScanning: !!v.isScanning,
    token: v.scanToken,
  });

  // Stands in for "the first folder's rebuild is still running when the second one lands"
  // (20k-clip USB stick vs. a small cached folder). Only the duration is faked; every commit
  // that follows is the shipped code path.
  let entered = false;
  v.handleFolderSelection = async function (files) {
    if (!entered) { entered = true; await new Promise(r => setTimeout(r, 2000)); }
    return orig.call(this, files);
  };

  const before = snap('before');
  const a = v.loadTauriDirectory(BIG);
  const t = Date.now();
  while (!entered && Date.now() - t < 8000) await new Promise(r => setTimeout(r, 20));
  const insideA = snap('A-inside-handleFolderSelection');
  const b = v.loadTauriDirectory(SMALL);   // small folder, lands while A is still rebuilding
  await Promise.all([b]);
  const afterB = snap('right-after-B-committed');
  await a;
  await new Promise(r => setTimeout(r, 800));
  const final = snap('final');
  delete v.handleFolderSelection;
  return JSON.stringify({ before, insideA, afterB, final,
    verdict: final.lastScannedPath === SMALL && final.groups !== afterB.groups ? 'STALE-COMMIT' : 'ok' }, null, 1);
})()
