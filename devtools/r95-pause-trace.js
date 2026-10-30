// R95: step 4 of `r95-tap-reveal.sh` read `show:false` five seconds after a real pause, which either
// means 「paused never auto-hides」 broke or means something resumed playback during the wait. Sample
// the whole state through the window instead of reading it twice and guessing.
(async () => {
    const v = window.viewer;
    const m = v.multiCameraPlayer;
    const cp = v.continuousPlayer;
    const vc = v.videoControls;
    const front = m.players.front;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const row = tag => ({
        tag,
        at: Math.round(performance.now()),
        show: vc.overlay.classList.contains('show'),
        playing: !!vc.isPlaying,
        paused: !!front.paused,
        seg: cp.currentSegmentIndex,
        t: +front.currentTime.toFixed(2),
        timer: !!vc.hideControlsTimer,
    });

    const before = row('before');
    // Stand in for the tap that put the bar up in the first place, so the question left over is the
    // narrow one: does anything take it down while the clip is paused?
    vc.showControls();
    // The same press the finger makes, minus the finger: the button's own handler.
    vc.togglePlayPause();
    const trace = [row('just-paused')];
    for (let i = 0; i < 12; i += 1) {
        await sleep(500);
        trace.push(row(`+${(i + 1) * 0.5}s`));
    }
    vc.togglePlayPause();
    trace.push(row('resumed'));
    return JSON.stringify({ before, trace }, null, 1);
})();
