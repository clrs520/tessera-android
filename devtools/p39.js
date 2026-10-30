(() => {
    // R64-1 residual check: does playback survive a segment crossing that nobody asked for — the clip
    // simply running out while the user watches? That is the 「播着播着自己停了」 half of the report,
    // and it goes through playNextSegment (the `ended` event), not through applySeek.
    //
    // It cannot be measured in one awaitPromise call: a seek on this fixture takes ~5s to buffer, and
    // the CDP answer has a ~10s budget, so the window starts in one call and is read in the next.
    //   call 1 → arms and seeks    call 2 → prints the rows
    const cp = viewer.continuousPlayer, p = cp.multiCameraPlayer;
    if (window.__p39rows) {
        const rows = window.__p39rows;
        delete window.__p39rows;
        clearInterval(window.__p39iv);
        return JSON.stringify({ boundary: cp.segmentStartTimes.slice(4, 8), total: cp.totalDuration,
            rows, now: { ct: +cp.getCurrentTime().toFixed(2), seg: cp.currentSegmentIndex,
                playing: !!p.isPlaying, paused: p.players.front.paused } });
    }
    const FROM = Number(window.__p39From || 105);
    p.setLayout('single');
    viewer.switchCamera('front');
    cp.seekToTime(FROM);
    p.playAll();
    window.__p39rows = [];
    window.__p39iv = setInterval(() => {
        const f = p.players.front;
        window.__p39rows.push([+f.currentTime.toFixed(2), cp.currentSegmentIndex, p.isPlaying ? 1 : 0,
            f.paused ? 1 : 0, f.readyState, f.ended ? 1 : 0]);
    }, 500);
    return JSON.stringify({ armed: FROM, ct: +cp.getCurrentTime().toFixed(2) });
})()
