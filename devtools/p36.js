(() => {
    // One-line-per-camera view of the deferred-feed regression: does a camera the layout never
    // showed come up (src+naturalWidth+readyState) and keep playing after the gesture?
    const p = viewer.multiCameraPlayer;
    const v = p.players.front;
    const row = c => {
        const e = p.players[c];
        return `${c}:${e.src ? 'src' : '---'}${p.suspendedFeeds.has(c) ? 'S' : ' '}${p.visibleCameras().includes(c) ? 'V' : ' '}${e.videoWidth}|rs${e.readyState}${e.paused ? 'P' : '-'}`;
    };
    return JSON.stringify({
        active: p.activeCamera, playing: !!p.isPlaying, frontPaused: v.paused,
        ct: +viewer.continuousPlayer.getCurrentTime().toFixed(1),
        seg: p.currentSegment && p.currentSegment.timestamp,
        feeds: ['front', 'back', 'left', 'right'].map(row).join(' '),
    });
})()
