(() => {
    const p = viewer.multiCameraPlayer;
    const row = (c) => {
        const v = p.players[c];
        return { cam: c, hasSrc: !!v.src, rs: v.readyState, paused: v.paused,
                 ct: +v.currentTime.toFixed(2),
                 cls: p.playerContainers[c].className.replace(/.*\bclass=/, '') };
    };
    return {
        layout: p.layoutMode, active: p.activeCamera, flag: p.isPlaying,
        suspended: Array.from(p.suspendedFeeds),
        loaded: Object.keys(p.players).filter(c => p.players[c].src),
        main: row(p.activeCamera),
        front: row('front'),
        seg: viewer.continuousPlayer.currentSegmentIndex
    };
})()
