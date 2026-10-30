(() => {
    // The list stepPhoneCamera actually walks, recomputed the way the shipped code does it, so a
    // 「swipe did nothing」 can be told apart from 「swipe was never claimed」.
    const p = viewer.multiCameraPlayer;
    const files = (p.currentSegment && p.currentSegment.files) || {};
    const views = (typeof ALL_CAMERA_VIEWS !== 'undefined' ? ALL_CAMERA_VIEWS : ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'])
        .filter(c => p.currentUrls[c] || files[c]);
    const band = viewer.pictureGestureBand();
    return JSON.stringify({
        active: p.activeCamera,
        views,
        loadedOnly: Object.keys(p.currentUrls).filter(c => p.currentUrls[c]),
        band: band && [Math.round(band.left), Math.round(band.width), Math.round(band.right)],
        thirds: band && [Math.round(band.left + band.width / 6), Math.round(band.left + band.width / 2), Math.round(band.left + band.width * 5 / 6)],
        bright: +(viewer.brightnessLevel || 0).toFixed(3),
        ct: +viewer.continuousPlayer.getCurrentTime().toFixed(1),
        paused: !!p.players.front.paused,
        layout: p.layoutMode,
    });
})()
