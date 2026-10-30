// R167 · scan responsiveness on a 3 000-event stick. The diagnostics must carry a real phase
// split, the sidecar batches must still load every event.json, and the main thread must not be
// held for one giant slice. Raw wall time on the emulator is fast storage; the long-task count is
// the transportable number.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const started = performance.now();
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam3k');
    for (let i = 0; i < 120 && (v.isScanning || !/TeslaCam3k$/.test(v.lastScannedPath || '')); i += 1) await sleep(250);
    await sleep(400);
    const stats = v.lastScanStats;
    return JSON.stringify({
        wall: Math.round(performance.now() - started),
        files: v.allFiles.length,
        events: v.eventGroups.length,
        sidecarSource: v.lastSidecarSource,
        sidecarReads: v.lastSidecarReadCount,
        failures: v.sidecarFailures,
        stats,
    });
})()
