(() => {
    const cp = viewer.continuousPlayer;
    const v = viewer.multiCameraPlayer.players.front;
    const before = v.currentTime;
    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                resolve(JSON.stringify({
                    advanced: +(v.currentTime - before).toFixed(2),
                    before: +before.toFixed(2),
                    after: +v.currentTime.toFixed(2),
                    paused: v.paused,
                    ended: v.ended,
                    seeking: v.seeking,
                    flag: viewer.multiCameraPlayer.isPlaying,
                    playLabel: document.getElementById('playPauseBtn')?.textContent?.trim(),
                    ct: +cp.getCurrentTime().toFixed(2),
                    seg: cp.currentSegmentIndex,
                    dur: isFinite(v.duration) ? +v.duration.toFixed(2) : null,
                    err: document.getElementById('jsErrorBanner')?.style.display !== 'none'
                }));
            } catch (e) {
                resolve(JSON.stringify({ probeError: String(e) }));
            }
        }, 1500);
    });
})()
