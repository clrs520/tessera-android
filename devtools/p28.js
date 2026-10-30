(() => {
    const player = viewer.multiCameraPlayer;
    const main = player.players[player.activeCamera];
    const per = {};
    ['front', 'back', 'left', 'right', 'left-driver', 'right-driver'].forEach(c => {
        const v = player.players[c];
        if (!v) return;
        per[c] = {
            src: v.src ? 'y' : '-',
            suspended: player.suspendedFeeds.has(c) ? 'S' : '-',
            visible: player.visibleCameras().includes(c) ? 'V' : '-',
            rs: v.readyState,
            nw: v.videoWidth,
            paused: v.paused ? 'P' : '-',
            ct: +v.currentTime.toFixed(1),
        };
    });
    return JSON.stringify({
        layout: player.layoutMode,
        active: player.activeCamera,
        flag: player.isPlaying,
        urlKeys: Object.keys(player.currentUrls || {}).length,
        ct: +viewer.continuousPlayer.getCurrentTime().toFixed(1),
        per,
    }, null, 1);
})()
