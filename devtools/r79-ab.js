// R79 same-machine A/B, one arm. `off` ablates `openSeamGate` — which returns 1.2.117's behaviour
// exactly, because with no gate `settle('frame')` falls through to an immediate release and `playAll()`
// never defers. `on` restores the real method. Then it restarts the fixture and starts playback, and
// leaves the run going so a later read can collect the boundaries.
//
// The AVD cannot show the gate's win (its six loads take 4-20 s, so the 1800 ms ceiling always closes
// with 0 of 6 ready). What this arm CAN show is the acceptance bar for a slow device: the gate must not
// make the hand-over worse. Same device, same tape, same layout — the only comparable pair.
(async () => {
    const v = window.viewer;
    const cp = v && v.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no multiCameraPlayer' });
    const arm = typeof window.__r79arm === 'string' ? window.__r79arm : 'on';
    window.__r79armDone = 'running ' + arm;
    if (!cp.__realOpenSeamGate) cp.__realOpenSeamGate = cp.openSeamGate;
    cp.openSeamGate = arm === 'off' ? function () { } : cp.__realOpenSeamGate;
    const ev = (v.eventGroups || []).find(e => e.eventId === 'TeslaCam/RecentClips');
    if (!ev) return JSON.stringify({ err: 'no fixture event' });
    cp.holdLog.length = 0;
    // Answered the caller first: two awaits in a row is enough for CDP to time out, and a timeout here
    // means "still running", not "failed".
    (async () => {
        await v.playEvent(ev.eventId);
        cp.setLayout('grid');
        // `playEvent` honours the remembered position, so an arm started where the last one stopped and
        // the two segment ranges would not overlap. Rewind to the head (only safe at a small value: this
        // tape is 18.27 s per file and a large seek silently clamps to the end), then start.
        v.continuousPlayer.seekToTime(0.5);
        await new Promise(r => setTimeout(r, 6000));
        cp.playAll();
        window.__r79armDone = JSON.stringify({
            arm, gated: cp.openSeamGate === cp.__realOpenSeamGate,
            idx: v.continuousPlayer.currentSegmentIndex, t: cp.clockTime && cp.clockTime(),
        });
    })();
    return JSON.stringify({ arm, kicked: true, gated: cp.openSeamGate === cp.__realOpenSeamGate });
})();
