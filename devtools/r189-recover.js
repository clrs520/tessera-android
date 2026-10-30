// R189 — a scan that died in the background is detected on return and re-run once.
(async () => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    v.lastScannedPath = '/sdcard/TeslaCamReg';
    v.isScanning = true;      // the page believes a walk is still in flight
    v.scanRetriedFor = null;
    const t0 = performance.now();
    await v.recoverInterruptedScan();
    const clearedMs = Math.round(performance.now() - t0);
    const cleared = v.isScanning === false;
    const toastSoon = document.querySelector('.toast')?.textContent || null;
    // The retry is queued 400 ms later; give the small fixture time to load.
    let restarted = false;
    for (let i = 0; i < 60 && !restarted; i++) {
        await new Promise((r) => setTimeout(r, 200));
        restarted = v.isScanning || (v.eventGroups || []).length > 0;
    }
    for (let i = 0; i < 80; i++) {
        await new Promise((r) => setTimeout(r, 200));
        if (!v.isScanning) break;
    }
    return JSON.stringify({
        cleared, clearedMs, toastSoon, restarted,
        finalScanning: v.isScanning,
        events: (v.eventGroups || []).length,
        retriedFor: v.scanRetriedFor,
    });
})()
