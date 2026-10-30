(() => {
    const area = viewer.dom.playerArea;
    const cam = viewer.multiCameraPlayer.activeCamera;
    const v = viewer.multiCameraPlayer.players[cam];
    const el = v.getBoundingClientRect();
    const band = viewer.pictureGestureBand();
    const hud = document.getElementById('phoneFeedHint');
    const shown = hud && hud.classList.contains('show');
    const hb = shown ? hud.getBoundingClientRect() : null;
    return JSON.stringify({
        vw: innerWidth, vh: innerHeight,
        layout: viewer.multiCameraPlayer.layoutMode,
        cam,
        nat: [v.videoWidth, v.videoHeight],
        area: [area.getBoundingClientRect().left, area.getBoundingClientRect().top, Math.round(area.getBoundingClientRect().width), Math.round(area.getBoundingClientRect().height)].map(Number),
        el: [Math.round(el.left), Math.round(el.top), Math.round(el.width), Math.round(el.height)],
        band: band ? [Math.round(band.left), Math.round(band.width), Math.round(band.right)] : null,
        third: band ? +(band.width / 3).toFixed(1) : null,
        chip: hb ? [Math.round(hb.left), Math.round(hb.right), Math.round(hb.width)] : null,
        chipInsidePicture: hb && band ? (hb.left >= band.left - 1 && hb.right <= band.right + 1) : null,
        bright: viewer.brightnessLevel,
        ct: +viewer.continuousPlayer.getCurrentTime().toFixed(2),
        paused: v.paused,
    }, null, 1);
})()
