(() => new Promise(res => {
    // Does the feed the user is looking at actually advance? `paused:false` with a stalled
    // currentTime is exactly the reported 卡死, so measure the clock, not the flag.
    const p = viewer.multiCameraPlayer;
    const cams = [p.activeCamera, 'front'];
    const t0 = {};
    cams.forEach(c => { t0[c] = p.players[c].currentTime; });
    setTimeout(() => {
        const out = {};
        cams.forEach(c => {
            const e = p.players[c];
            out[c] = { d: +(e.currentTime - t0[c]).toFixed(2), rs: e.readyState, paused: e.paused, buf: e.buffered.length ? +e.buffered.end(e.buffered.length - 1).toFixed(1) : 0 };
        });
        res(JSON.stringify({ active: p.activeCamera, playing: !!p.isPlaying, barCt: +viewer.continuousPlayer.getCurrentTime().toFixed(1), out }));
    }, 2000);
}))()
