(() => {
    const m = viewer.multiCameraPlayer, cp = viewer.continuousPlayer;
    const loadSrc = m.loadSegmentForAllCameras.toString();
    return {
        deferredFn: typeof m.loadDeferredFeed,
        currentSegment: m.currentSegment !== undefined ? 'present' : 'absent',
        loadHasKeep: loadSrc.includes('keep.has'),
        loadHasDataset: loadSrc.includes('dataset.deferred'),
        loadHasContinue: loadSrc.includes('continue'),
        applySeekBack: cp.applySeek.toString().includes('wanted >= from'),
        waitCap: viewer.multiCameraPlayer.waitForAllVideosLoaded.toString().includes('4000'),
        band: typeof viewer.pictureGestureBand
    };
})()
