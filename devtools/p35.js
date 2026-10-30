(() => {
    // Geometry the ±10s zone test needs, read from the live ruler rather than hardcoded per
    // orientation — the landscape x's are meaningless in portrait.
    const band = viewer.pictureGestureBand();
    const area = viewer.dom.playerArea.getBoundingClientRect();
    const cam = viewer.multiCameraPlayer.activeCamera;
    const v = viewer.multiCameraPlayer.players[cam].getBoundingClientRect();
    // Where the letterbox actually is (element rect minus the painted width) — the black left and
    // right of it are the two places a tap must do nothing.
    const padL = v.width - band.width;
    return JSON.stringify({
        orient: `${window.innerWidth}x${window.innerHeight}`,
        band: [Math.round(band.left), Math.round(band.width), Math.round(band.right)],
        thirds: [Math.round(band.left + band.width / 6), Math.round(band.left + band.width / 2), Math.round(band.left + band.width * 5 / 6)],
        thirdPx: +(band.width / 3).toFixed(1),
        pic: [Math.round(v.left), Math.round(v.top), Math.round(v.width), Math.round(v.height)],
        tapY: Math.round(v.top + v.height / 2),
        blackLeft: Math.round(Math.max(area.left + 6, v.left - Math.min(60, padL / 2))),
        blackRight: Math.round(Math.min(area.right - 6, v.right + Math.min(60, padL / 2))),
        area: [Math.round(area.left), Math.round(area.top), Math.round(area.width), Math.round(area.height)],
        layout: viewer.multiCameraPlayer.layoutMode,
        cam,
        nat: viewer.multiCameraPlayer.players[cam].videoWidth + 'x' + viewer.multiCameraPlayer.players[cam].videoHeight,
    });
})()
