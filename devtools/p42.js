(() => {
    // Which phase of a segment crossing eats the seconds? The server answers a range read of the next
    // file in ~50ms, so the wait is inside the media element, but 「inside the element」 covers
    // loadstart → loadedmetadata → loadeddata → canplay → the first frame actually advancing.
    // Arm it, cross a boundary (seek a few seconds before one, or just watch), then read it.
    const p = viewer.multiCameraPlayer;
    if (window.__p42) {
        const rows = window.__p42; delete window.__p42;
        const t0 = rows.length ? rows[0].t : 0;
        return JSON.stringify(rows.map(r => [r.ev, '+' + (r.t - t0), 'ct' + r.ct, 'rs' + r.rs, r.src]));
    }
    const cam = p.activeCamera;
    const el = p.players[cam];
    window.__p42 = [];
    const t0 = Date.now();
    ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'seeking', 'seeked',
        'waiting', 'stalled', 'suspend', 'abort', 'error'].forEach(ev => el.addEventListener(ev, () => {
        window.__p42.push({ ev, t: Date.now() - t0, ct: +el.currentTime.toFixed(2), rs: el.readyState,
            src: el.currentSrc ? el.currentSrc.slice(-10) : '' });
    }, true));
    return JSON.stringify({ armed: cam, ct: +viewer.continuousPlayer.getCurrentTime().toFixed(1),
        playing: !!p.isPlaying });
})()
