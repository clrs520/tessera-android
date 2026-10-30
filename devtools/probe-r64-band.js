(() => {
    const areaBox = viewer.dom.playerArea.getBoundingClientRect();
    const band = viewer.pictureGestureBand();
    const player = viewer.multiCameraPlayer;
    const video = player.players[player.activeCamera];
    const cell = video ? video.getBoundingClientRect() : null;
    const hud = document.getElementById('phoneFeedHint');
    const r = (b) => b ? [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] : null;
    viewer.showPhoneFeedChip('+10s', 'right');
    const chipRight = hud.getBoundingClientRect();
    viewer.showPhoneFeedChip('-10s', 'left');
    const chipLeft = hud.getBoundingClientRect();
    return JSON.stringify({
        layout: player.layoutMode,
        active: player.activeCamera,
        natural: video ? [video.videoWidth, video.videoHeight] : null,
        area: r(areaBox),
        cell: r(cell),
        band: band ? [Math.round(band.left), Math.round(band.width), Math.round(band.right)] : null,
        thirds: band ? [Math.round(band.left + band.width / 3), Math.round(band.left + band.width * 2 / 3)] : null,
        zoom: viewer.feedZoom && viewer.feedZoom[player.activeCamera] || null,
        chipRight: [Math.round(chipRight.left), Math.round(chipRight.right)],
        chipLeft: [Math.round(chipLeft.left), Math.round(chipLeft.right)],
        err: document.getElementById('jsErrorBanner').style.display !== 'none'
    });
})()
