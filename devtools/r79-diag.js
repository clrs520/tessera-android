// R79 diagnostic: one gate, three fake tiles, dumped after every step.
// Used to read what `r79-gate.js` only reports as a failed check.
(() => {
    const cp = window.viewer && window.viewer.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no multiCameraPlayer' });
    const mk = () => {
        const l = {};
        const p = {
            readyState: 1, networkState: 2, error: null, currentTime: 0, duration: NaN,
            buffered: { length: 0 }, frames: [],
            addEventListener: (t, fn) => { (l[t] = l[t] || []).push(fn); },
            removeEventListener: (t, fn) => { l[t] = (l[t] || []).filter(f => f !== fn); },
            requestVideoFrameCallback: cb => p.frames.push(cb),
            fire: t => (l[t] || []).slice().forEach(fn => fn()),
        };
        return p;
    };
    const save = { held: cp.heldFrames, seam: cp.seam, rel: cp.releaseHeldFrame, resume: cp.seamResume };
    const calls = [];
    const trace = [];
    cp.releaseHeldFrame = function (cam, why) {
        const held = this.heldFrames[cam];
        calls.push(`${cam}:${why}${held && held.gate ? '/' + held.gate : ''}`);
        delete this.heldFrames[cam];
    };
    const snap = label => trace.push({
        label,
        held: Object.keys(cp.heldFrames),
        need: cp.seam ? Array.from(cp.seam.need) : null,
        ready: cp.seam ? Array.from(cp.seam.ready) : null,
        pending: Object.keys(cp.heldFrames).map(k => k + '=' + (cp.heldFrames[k].pending ? 'Y' : 'n')),
        calls: calls.slice(),
    });
    try {
        cp.pauseAll();
        cp.heldFrames = {};
        cp.seamResume = false;
        const players = {};
        ['front', 'back', 'left'].forEach(cam => { cp.heldFrames[cam] = { canvas: document.createElement('div'), armedAt: performance.now() }; players[cam] = mk(); });
        snap('armed');
        cp.openSeamGate();
        snap('gate opened');
        ['front', 'back', 'left'].forEach(cam => cp.awaitHeldFrameRelease(cam, players[cam]));
        snap('awaiters installed');
        const show = cam => { players[cam].fire('loadeddata'); players[cam].frames.splice(0).forEach(cb => cb()); };
        show('front'); snap('front presented');
        show('back'); snap('back presented');
        players.left.error = { name: 'MediaError' };
        players.left.fire('error'); snap('left errored');
        show('left'); snap('left presented');
        return JSON.stringify({ trace }, null, 1);
    } finally {
        cp.closeSeamGate('diag-end');
        Object.keys(cp.heldFrames).forEach(cam => cp.heldFrames[cam].canvas.remove());
        cp.heldFrames = save.held;
        cp.seam = save.seam;
        cp.seamResume = save.resume;
        cp.releaseHeldFrame = save.rel;
    }
})();
