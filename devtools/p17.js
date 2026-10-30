(() => {
    // Who pauses the feed? Records every media lifecycle event on the front element plus a snapshot
    // of the transport flag, and drives the same seed sequence a probe would, all inside the page so
    // the causality is not lost between CDP round trips.
    const p = viewer.multiCameraPlayer.players.front;
    const mcp = viewer.multiCameraPlayer;
    const t0 = performance.now();
    window.__trace = [];
    const T = (tag, extra) => window.__trace.push(Object.assign(
        { tag, t: Math.round(performance.now() - t0), play: mcp.isPlaying ? 1 : 0, paused: p.paused ? 1 : 0, rs: p.readyState, ct: +p.currentTime.toFixed(2) }, extra || {}));
    ['play', 'playing', 'pause', 'error', 'waiting', 'stalled', 'ended', 'loadstart', 'loadeddata', 'loadedmetadata'].forEach(ev =>
        p.addEventListener(ev, () => T('evt:' + ev), false));
    const oUpdate = Object.getPrototypeOf(viewer.videoControls).updatePlayState;
    if (oUpdate && !oUpdate.__hooked) {
        oUpdate.__hooked = true;
        Object.getPrototypeOf(viewer.videoControls).updatePlayState = function (playing) {
            T('flag:' + playing);
            return oUpdate.call(this, playing);
        };
    }
    T('begin');
    viewer.playEvent('TeslaCam/RecentClips');
    setTimeout(() => { T('before:setLayout'); mcp.setLayout('single'); }, 9000);
    setTimeout(() => { T('before:seek'); viewer.continuousPlayer.seekToTime(300); }, 9400);
    for (let i = 1; i <= 22; i++) setTimeout(() => T('snap' + i), 10000 + i * 500);
    return 'traced';
})()
