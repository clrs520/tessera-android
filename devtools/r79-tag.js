// R79 (throwaway): does the gate's close tag actually reach the diagnostics text the user pastes?
// The AVD cannot show it on a real splice — its six loads take 4-20 s, so the 1800 ms ceiling always
// closes with `0/6 ready` and writes no tag. So arm three tiles, answer all three inside the window
// (that is the phone's 446-927 ms profile), and read the rows back out of the REAL `describeHolds()`.
// Live players are paused and restored; the rows this writes are spliced out at the end.
(async () => {
    const cp = window.viewer && window.viewer.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no multiCameraPlayer' });
    const save = {
        held: cp.heldFrames, seam: cp.seam, play: cp.playAll, playing: cp.isPlaying,
        resume: cp.seamResume, log: (cp.holdLog || []).slice(),
    };
    const mkPlayer = () => {
        const listeners = {};
        const p = {
            readyState: 1, networkState: 2, error: null, currentTime: 0, duration: 18.27,
            buffered: { length: 0 }, frames: [],
            addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
            removeEventListener: (t, fn) => { listeners[t] = (listeners[t] || []).filter(f => f !== fn); },
            requestVideoFrameCallback: cb => p.frames.push(cb),
            fire: t => (listeners[t] || []).slice().forEach(fn => fn()),
        };
        return p;
    };
    try {
        cp.pauseAll();
        // The ledger is capped at 30 rows and shifts, so mark where this run begins.
        cp.holdLog.push({ cam: 'MARKER', seg: 'tag-probe', skip: 'start' });
        const cams = ['front', 'back', 'left'];
        cp.heldFrames = {};
        cp.seamResume = false;
        const players = {};
        cams.forEach(cam => {
            cp.heldFrames[cam] = { canvas: document.createElement('div'), armedAt: performance.now() - 500 };
            players[cam] = mkPlayer();
        });
        cp.openSeamGate();
        cams.forEach(cam => cp.awaitHeldFrameRelease(cam, players[cam]));
        // The phone's stagger: three tiles answer 400 ms apart, all well inside the ceiling.
        for (const cam of cams) {
            await new Promise(r => setTimeout(r, 400));
            players[cam].fire('loadeddata');
            players[cam].frames.splice(0).forEach(cb => cb());
        }
        const rows = cp.describeHolds().slice(cp.holdLog.findIndex(e => e.cam === 'MARKER'));
        return JSON.stringify({
            gateNow: cp.seam,
            heldNow: Object.keys(cp.heldFrames),
            rows,
        }, null, 1);
    } finally {
        cp.closeSeamGate('probe-end');
        Object.keys(cp.heldFrames).forEach(cam => cp.heldFrames[cam].canvas.remove());
        cp.heldFrames = save.held;
        cp.seam = save.seam;
        cp.seamResume = save.resume;
        cp.playAll = save.play;
        // The ledger is capped and shifts, so index arithmetic cannot be trusted here — put the
        // captured rows back whole.
        cp.holdLog.length = 0;
        save.log.forEach(row => cp.holdLog.push(row));
        if (save.playing) cp.playAll();
    }
})();
