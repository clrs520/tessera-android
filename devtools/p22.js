(() => {
    const area = viewer.dom.playerArea.getBoundingClientRect();
    const band = viewer.pictureGestureBand();
    const v = viewer.multiCameraPlayer.players[viewer.multiCameraPlayer.activeCamera];
    return JSON.stringify({
        band: band ? [Math.round(band.left), Math.round(band.width), Math.round(band.right)] : null,
        area: [Math.round(area.left), Math.round(area.top), Math.round(area.width), Math.round(area.height)],
        el: [Math.round(v.getBoundingClientRect().left), Math.round(v.getBoundingClientRect().width)],
        steps: window.__steps || [],
        ct: +viewer.continuousPlayer.getCurrentTime().toFixed(2),
        paused: v.paused,
        flag: viewer.videoControls.isPlaying,
    }, null, 1);
})()
