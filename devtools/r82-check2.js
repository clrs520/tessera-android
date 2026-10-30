// R82 acceptance, second pass.
//
// `waitForScan` in the first pass polled `isScanning` before the click had set it (the scan flag is
// raised after an await inside loadTauriDirectory), so B and C were snapshots taken *during* the
// scan. Here every wait claims the scan first.
(async () => {
  const v = window.viewer;
  const el = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  if (!v || !v.eventGroups?.length) return { aborted: 'no events loaded' };

  const out = { started: Date.now(), phases: [], done: false };
  window.__r82b = out;

  const snap = () => {
    const vs = [...document.querySelectorAll('video')];
    return {
      event: v.currentEvent ? v.currentEvent.eventId : null,
      at: +(v.continuousPlayer?.getCurrentTime?.() ?? 0).toFixed(2),
      camera: v.multiCameraPlayer?.activeCamera,
      layout: v.multiCameraPlayer?.layoutMode,
      playing: !!v.multiCameraPlayer?.isPlaying,
      srcs: vs.filter(x => x.src).length,
      rs: vs.map(x => x.readyState).join(''),
      clipDisabled: el('clipBtn')?.disabled, fsDisabled: el('fullscreenBtn')?.disabled,
      rowLabel: document.querySelector('#menuRefreshBtn .btn-text')?.textContent,
      drawer: v.dom.sidebar.classList.contains('collapsed') ? 'away' : 'open',
      toast: document.querySelector('.toast')?.textContent || ''
    };
  };

  let scans = 0;
  const realScan = v.nativeScanFiles.bind(v);
  v.nativeScanFiles = path => { scans++; return realScan(path); };

  // Click, then wait until the scan has both started and finished.
  const refresh = async (ms) => {
    scans = 0;
    const t0 = Date.now();
    el('menuRefreshBtn').click();
    const deadline = t0 + ms;
    while (!v.isScanning && Date.now() < deadline) await wait(120);
    const began = Date.now();
    while (v.isScanning && Date.now() < deadline) await wait(200);
    return { scanMs: Date.now() - began, wallMs: Date.now() - t0, scans };
  };

  await v.playEvent(v.eventGroups[0].eventId);
  await wait(3000);
  v.multiCameraPlayer.setCamera('left');
  v.multiCameraPlayer.setLayout('grid4');
  await wait(2000);

  // ---- B. unchanged folder: no rebuild, and how long the wait actually is -------------------
  const beforeB = snap();
  const filesB = v.allFiles, groupsB = v.eventGroups;
  const timingB = await refresh(180000);
  await wait(2500);
  const afterB = snap();
  out.phases.push({ name: 'B unchanged skips rebuild', timing: timingB,
    before: beforeB, after: afterB,
    filesUntouched: filesB === v.allFiles, groupsUntouched: groupsB === v.eventGroups,
    sameEvent: beforeB.event === afterB.event, keptPos: afterB.at });

  // ---- C. three taps 300ms apart into a real rebuild ----------------------------------------
  v.lastScanSignature = null;
  const beforeC = snap();
  scans = 0;
  el('menuRefreshBtn').click();
  await wait(300);
  const midScanning = v.isScanning;
  el('menuRefreshBtn').click();
  await wait(300);
  el('menuRefreshBtn').click();
  await wait(600);
  const during = snap();
  const t0 = Date.now();
  while (v.isScanning && Date.now() - t0 < 180000) await wait(250);
  await wait(5000);
  const afterC = snap();
  out.phases.push({ name: 'C re-entrant taps', scans: scans, isScanningAtTap2: midScanning,
    duringToast: during.toast, before: beforeC, after: afterC });

  v.nativeScanFiles = realScan;
  out.done = true;
  return { kicked: true };
})();
