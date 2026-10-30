(() => {
    // Continuous 300ms sampler of the active feed: distinguishes a paused feed from a stalled one,
    // which a probe that only samples after each tap cannot tell.
    const mcp = viewer.multiCameraPlayer;
    if (window.__sampTimer) clearInterval(window.__sampTimer);
    window.__samples = [];
    const t0 = performance.now();
    window.__sampTimer = setInterval(() => {
        const p = mcp.players[mcp.activeCamera];
        const f = mcp.players.front;
        if (!p) return;
        window.__samples.push({
            t: +(performance.now() - t0).toFixed(0),
            cam: mcp.activeCamera,
            ct: +p.currentTime.toFixed(2),
            fct: +f.currentTime.toFixed(2),
            paused: p.paused ? 1 : 0,
            fpaused: f.paused ? 1 : 0,
            rs: p.readyState,
            sk: p.seeking ? 1 : 0,
            buf: p.buffered.length ? +p.buffered.end(p.buffered.length - 1).toFixed(1) : -1,
            seg: viewer.continuousPlayer.currentSegmentIndex,
            play: mcp.isPlaying ? 1 : 0,
        });
        if (window.__samples.length > 120) window.__samples.shift();
    }, 300);
    return 'sampling';
})()
