(async () => {
    await viewer.playEvent('TeslaCam/RecentClips');
    viewer.multiCameraPlayer.setLayout('single');
    await new Promise(r => setTimeout(r, 2500));
    const v = viewer.multiCameraPlayer.players.front;
    const b = viewer.dom.playerArea.getBoundingClientRect();
    const band = viewer.pictureGestureBand();
    const video = viewer.multiCameraPlayer.players[viewer.multiCameraPlayer.activeCamera].getBoundingClientRect();
    return JSON.stringify({
        ev: viewer.currentEvent?.eventId,
        segs: viewer.currentEvent?.segments?.length,
        total: +viewer.totalDuration.toFixed(1),
        durs: viewer.segmentDurations?.map(d => +d.toFixed(1)),
        starts: viewer.segmentStartTimes,
        layout: viewer.multiCameraPlayer.layoutMode,
        flag: viewer.multiCameraPlayer.isPlaying,
        paused: v.paused,
        ct: +v.currentTime.toFixed(2),
        dur: +v.duration.toFixed(2),
        nat: [v.videoWidth, v.videoHeight],
        area: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
        pic: [Math.round(video.left), Math.round(video.top), Math.round(video.width), Math.round(video.height)],
        band: band && [Math.round(band.left), Math.round(band.width), Math.round(band.right)],
        thirds: band && [Math.round(band.left + band.width / 3), Math.round(band.left + band.width * 2 / 3)]
    });
})()
