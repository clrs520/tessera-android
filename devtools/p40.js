(() => {
    // What actually stops the clock? Every `pause` on the visible feed is logged with the JS stack that
    // asked for it, because a ±10s double tap that lands while the clip is playing has been seen to
    // leave the transport paused, and `paused:true` alone does not say who did it.
    //   call 1 arms (and marks the baseline), call 2 reads.
    //
    // ⚠ The read must not `delete window.__pauseLog`: these listeners stay attached for the life of the
    // page, so the next pause would push into undefined and throw a TypeError into the page's error log
    // (it shows up in p14.errs and reads as an app crash). Truncate the array in place instead, and arm
    // only once so a re-arm does not stack a second copy of every listener.
    const p = viewer.multiCameraPlayer;
    if (window.__pauseArmed) {
        const rows = (window.__pauseLog || []).slice();
        window.__pauseLog = [];
        return JSON.stringify({ rows, ct: +viewer.continuousPlayer.getCurrentTime().toFixed(2),
            playing: !!p.isPlaying, paused: !!p.players.front.paused });
    }
    window.__pauseLog = [];
    window.__pauseArmed = true;
    const cam = p.activeCamera;
    const el = p.players[cam];
    ['pause', 'ended', 'stalled', 'waiting'].forEach(ev => el.addEventListener(ev, () => {
        (window.__pauseLog || []).push({ ev, t: Date.now() % 100000,
            ct: +el.currentTime.toFixed(2), playing: !!p.isPlaying,
            stack: (new Error().stack || '').split('\n').slice(1, 4).join(' | ')
                .replace(/https?:\/\/[^\s]*?script\.js/g, 'script.js') });
    }, true));
    return JSON.stringify({ armed: cam, ct: +el.currentTime.toFixed(2), playing: !!p.isPlaying });
})()
