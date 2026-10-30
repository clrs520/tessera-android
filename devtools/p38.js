(() => new Promise(res => {
    // R64-1c follow-up: a feed the layout never showed has to land where the user already is.
    // `applyFeedVisibility()` hands `loadDeferredFeed()` the active feed as the reference — and after
    // `setCamera()` the active feed *is* the one being loaded, whose clock is 0.
    const p = viewer.multiCameraPlayer;
    const rows = {};
    p.setLayout('single');
    p.setCamera('front');
    viewer.continuousPlayer.seekToTime(130).then(() => {
        p.playAll();
        setTimeout(() => {
            const ref = p.players.front.currentTime;
            rows.refBefore = +ref.toFixed(1);
            rows.activeBefore = p.activeCamera;
            viewer.switchCamera('back');
            rows.activeAfter = p.activeCamera;
            setTimeout(() => {
                rows.newFeedCt = +p.players.back.currentTime.toFixed(1);
                rows.newRs = p.players.back.readyState;
                rows.paused = p.players.back.paused;
                rows.playing = !!p.isPlaying;
                rows.frontCt = +p.players.front.currentTime.toFixed(1);
                res(JSON.stringify(rows));
            }, 1500);
        }, 1200);
    });
}))()
