(() => {
    const log = viewer.__swipeLog = [];
    if (!viewer.__swipeWrapped) {
        viewer.__swipeWrapped = true;
        const orig = viewer.stepPhoneCamera.bind(viewer);
        viewer.stepPhoneCamera = (dir) => { log.push({t: Date.now(), dir, cam: viewer.multiCameraPlayer.activeCamera}); return orig(dir); };
    }
    const area = viewer.dom.playerArea;
    if (!viewer.__swipeSniff) {
        viewer.__swipeSniff = true;
        ['pointerdown','pointermove','pointerup'].forEach(t => area.addEventListener(t, e => {
            if (!e.isPrimary) return;
            log.push({ ev: t, x: Math.round(e.clientX), y: Math.round(e.clientY),
                phone: isPhoneLayout(), cur: !!viewer.currentEvent,
                fingers: viewer.pictureFingerPoints ? viewer.pictureFingerPoints(1) : null,
                blocked: viewer.blocksFeedGesture(e.target),
                zoomed: viewer.zoomedFeedAt ? !!viewer.zoomedFeedAt(e) : null });
        }, true));
    }
    return 'armed';
})()
