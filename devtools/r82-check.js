// R82 acceptance, run inside the app's WebView.
//
// Three things the user reported all come from one mechanism — the refresh rebuilds the clip list
// and nothing puts the picture back — so this probe exercises that mechanism three ways:
//   A. a scan that *does* rebuild must leave the same clip, position, camera and layout standing;
//   B. a scan of an unchanged folder must not rebuild at all (`allFiles` identity proves it);
//   C. a second tap while the first scan is running must not start a second scan.
//
// Fire-and-forget: it returns immediately and writes `window.__r82check`. Poll that.
(async () => {
  const v = window.viewer;
  const el = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  if (!v || !v.eventGroups?.length) return { aborted: 'no events loaded' };

  const out = { started: Date.now(), phases: [], done: false };
  window.__r82check = out;

  const snap = () => {
    const vs = [...document.querySelectorAll('video')];
    const clip = el('clipBtn'), fs = el('fullscreenBtn');
    return {
      event: v.currentEvent ? v.currentEvent.eventId : null,
      at: v.continuousPlayer?.getCurrentTime?.() ?? null,
      camera: v.multiCameraPlayer?.activeCamera,
      layout: v.multiCameraPlayer?.layoutMode,
      playing: !!v.multiCameraPlayer?.isPlaying,
      srcs: vs.filter(x => x.src).length,
      rs: vs.map(x => x.readyState).join(''),
      clipDisabled: clip ? clip.disabled : 'no-el',
      fsDisabled: fs ? fs.disabled : 'no-el',
      rowLabel: document.querySelector('#menuRefreshBtn .btn-text')?.textContent,
      toast: document.querySelector('.toast')?.textContent || ''
    };
  };

  // Count scans without touching product code: loadTauriDirectory looks the method up on `this`.
  let scans = 0;
  const realScan = v.nativeScanFiles.bind(v);
  v.nativeScanFiles = path => { scans++; return realScan(path); };

  const waitForScan = async (ms) => {
    const deadline = Date.now() + ms;
    while (v.isScanning && Date.now() < deadline) await wait(250);
    return !v.isScanning;
  };

  // Open a clip and give it a camera + layout that playEvent would not pick on its own, so a
  // restore that does nothing is detectable.
  const eventId = v.eventGroups[0].eventId;
  await v.playEvent(eventId);
  await wait(2000);
  v.multiCameraPlayer.setCamera('left');
  v.multiCameraPlayer.setLayout('grid4');
  await wait(1500);

  // ---- A. rebuild must restore -------------------------------------------------------------
  v.lastScanSignature = null;
  const before = snap();
  before.filesId = 'a' + (Math.random() * 1e6 | 0);
  const beforeFiles = v.allFiles;
  el('menuRefreshBtn').click();
  await wait(1200);
  const during = snap();
  await waitForScan(180000);
  await wait(6000);
  const afterA = snap();
  out.phases.push({
    name: 'A rebuild restores',
    before: { event: before.event, at: before.at, camera: before.camera, layout: before.layout, playing: before.playing },
    duringLabel: during.rowLabel,
    after: { event: afterA.event, at: afterA.at, camera: afterA.camera, layout: afterA.layout,
      srcs: afterA.srcs, rs: afterA.rs, playing: afterA.playing,
      clipDisabled: afterA.clipDisabled, fsDisabled: afterA.fsDisabled, toast: afterA.toast },
    rebuilt: beforeFiles !== v.allFiles,
    scans: scans,
    sameEvent: before.event === afterA.event,
    cameraKept: afterA.camera === 'left',
    layoutKept: afterA.layout === 'grid4',
    positionClose: before.at !== null && afterA.at !== null && Math.abs(afterA.at - before.at) < 30
  });

  // ---- B. unchanged folder must not rebuild ------------------------------------------------
  const beforeB = v.allFiles;
  const groupsB = v.eventGroups;
  scans = 0;
  el('menuRefreshBtn').click();
  await waitForScan(180000);
  await wait(1500);
  const afterB = snap();
  out.phases.push({
    name: 'B unchanged skips rebuild',
    scanCount: scans,
    filesUntouched: beforeB === v.allFiles,
    groupsUntouched: groupsB === v.eventGroups,
    eventKept: afterB.event === before.event,
    srcs: afterB.srcs,
    clipDisabled: afterB.clipDisabled,
    toast: afterB.toast,
    labelRestored: afterB.rowLabel
  });

  // ---- C. a tap during a scan must not start a second one ----------------------------------
  v.lastScanSignature = null;
  scans = 0;
  el('menuRefreshBtn').click();
  await wait(400);
  el('menuRefreshBtn').click();
  await wait(400);
  el('menuRefreshBtn').click();
  const guarded = snap();
  await waitForScan(180000);
  await wait(4000);
  out.phases.push({
    name: 'C re-entrant taps',
    scansDuringThreeTaps: scans,
    toastWhileScanning: guarded.toast,
    labelWhileScanning: guarded.rowLabel,
    eventAfter: snap().event,
    srcsAfter: snap().srcs
  });

  v.nativeScanFiles = realScan;
  out.done = true;
  out.finished = Date.now();
  return { kicked: true };
})();
