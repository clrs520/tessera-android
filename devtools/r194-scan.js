(async () => {
    const view = window.viewer;
    await view.loadTauriDirectory('/sdcard/TeslaCamBig');
    const s = view.lastScanStats || {};
    return JSON.stringify({
        events: view.eventGroups.length,
        wall: s.wallMs, native: s.nativeMs, walk: s.walkMs,
        stat: s.statMs, skip: s.statSkipped,
        dirsSeen: s.dirsSeen, dirsCached: s.dirsCached,
        files: s.files, batches: s.streamBatches, firstBatch: s.firstBatchMs,
    });
})()
