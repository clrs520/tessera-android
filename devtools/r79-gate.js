// R79: the seam gate's state machine, driven through the real hand-over path
// (`awaitHeldFrameRelease` -> `settle('frame')` -> `markSeamReady` -> `closeSeamGate`) with fake players,
// because the emulator's own splices take 4-9 s and a real boundary cannot be paced by a test.
//
// `releaseHeldFrame` is WRAPPED, never replaced: the ledger hook that marks a tile "answered" lives
// inside the real method, so replacing it would test a machine that no longer exists. The fake rows the
// real method appends to `holdLog` are spliced out again at the end.
// The live players are paused for the duration and restored afterwards.
(async () => {
    // The seam lives on MultiCameraPlayer (ContinuousVideoPlayer only owns `currentSegmentIndex`).
    const cp = window.viewer && window.viewer.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no window.viewer.multiCameraPlayer' });
    if (typeof cp.openSeamGate !== 'function') return JSON.stringify({ err: 'openSeamGate missing' });

    const save = {
        held: cp.heldFrames, seam: cp.seam, release: cp.releaseHeldFrame,
        play: cp.playAll, tsr: window.isTouchShellRuntime, playing: cp.isPlaying,
        resume: cp.seamResume, logLen: (cp.holdLog || []).length,
    };
    const calls = [];
    const mkPlayer = () => {
        const listeners = {};
        const p = {
            readyState: 1, networkState: 2, error: null, currentTime: 0, duration: NaN,
            buffered: { length: 0 }, frames: [],
            addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
            removeEventListener: (t, fn) => { listeners[t] = (listeners[t] || []).filter(f => f !== fn); },
            requestVideoFrameCallback: cb => p.frames.push(cb),
            fire: t => (listeners[t] || []).slice().forEach(fn => fn()),
        };
        return p;
    };
    const fakeHold = () => ({ canvas: document.createElement('div'), armedAt: performance.now() });
    // Does `playAll()` tell the tiles to play, and how long after the call does each dispatch land?
    // Wraps the media elements' own `play` as an own property so `Promise.all` still runs for real, and
    // `delete` gives back the prototype method. Without this the only observable was wall-clock, which on
    // an emulator measures buffering rather than the gate.
    const fireSpy = {
        _marks: null, _on: false,
        arm() {
            const t0 = performance.now();
            fireSpy._marks = [];
            Object.values(cp.players).forEach(p => {
                if (!p || fireSpy._on) return;
                const orig = p.play.bind(p);
                p.play = () => { fireSpy._marks.push(performance.now() - t0); return orig(); };
            });
            fireSpy._on = true;
            return fireSpy;
        },
        disarm() {
            Object.values(cp.players).forEach(p => { if (p) delete p.play; });
            fireSpy._on = false;
        },
        times() { return fireSpy._marks || []; },
    };
    // `keepResume` is for phase 5: a gate closing as `superseded` hands its deferred start to the next
    // gate through `seamResume`, so re-arming must not wipe the very state under test.
    const rewire = (cams, opts = {}) => {
        const players = {};
        cp.heldFrames = {};
        if (!opts.keepResume) cp.seamResume = false;
        cams.forEach(cam => { cp.heldFrames[cam] = fakeHold(); players[cam] = mkPlayer(); });
        cp.openSeamGate();
        cams.forEach(cam => cp.awaitHeldFrameRelease(cam, players[cam]));
        return players;
    };
    // The tag is `ready 3/3 1149ms` — it contains slashes, so it cannot be recovered with split('/').
    const tagOf = call => {
        const raw = call.slice(call.indexOf('/') + 1);
        return raw.includes('/') ? raw.replace(/ \d+ms$/, '') : '';
    };
    const present = players => cam => { players[cam].fire('loadeddata'); players[cam].frames.splice(0).forEach(cb => cb()); };
    const results = [];
    const check = (name, got, want) => results.push({ name, pass: JSON.stringify(got) === JSON.stringify(want), got, want });

    cp.releaseHeldFrame = function (cam, why, via) {
        const held = this.heldFrames[cam];
        calls.push(`${cam}:${why}${held && held.gate ? '/' + held.gate : ''}`);
        return save.release.call(this, cam, why, via);
    };

    try {
        cp.pauseAll();

        // 1. Nothing comes down until every held tile has answered — and then all of them do, tagged
        //    with the same close, because that shared turn is the entire point of the gate.
        calls.length = 0;
        let p = rewire(['front', 'back', 'left']);
        let one = present(p);
        one('front'); one('back');
        check('two-of-three answered releases nothing', calls.length, 0);
        check('and the gate is still open', cp.seam ? cp.seam.ready.size : -1, 2);
        one('left');
        check('third answer drops all three at once', calls.length, 3);
        const tags = calls.map(tagOf);
        check('all three carry the same ready-close tag', new Set(tags).size === 1 && tags[0] === 'ready 3/3', true);
        check('no straggler: the gate is gone', cp.seam, null);
        check('nothing is left covered', Object.keys(cp.heldFrames), []);

        // 2. A feed that answers with an error is handed back at once and must not hold the others.
        calls.length = 0;
        p = rewire(['front', 'back', 'left']);
        one = present(p);
        one('front');
        p.left.error = { name: 'MediaError' };
        p.left.fire('error');
        check('the failing tile came down immediately', calls.filter(c => c.startsWith('left:decode-error')).length, 1);
        check('and it stopped being waited for', cp.seam.ready.size, 2);
        one('back');
        check('the gate closed on the two that could answer', cp.seam, null);
        check('front was released with it', calls.filter(c => c.startsWith('front:frame')).length, 1);
        check('the broken tile was not released twice', calls.filter(c => c.startsWith('left')).length, 1);

        // 3. The ceiling hands back what is ready and leaves the rest covered — uncovering a tile that
        //    has no picture is the black gap R74 was written to remove.
        calls.length = 0;
        p = rewire(['front', 'back', 'left']);
        one = present(p);
        one('front');
        const realPlay = cp.playAll;
        cp.playAll = async function () { calls.push('play'); };
        await new Promise(r => setTimeout(r, 2100));
        check('ceiling released the ready tile', calls.filter(c => c.startsWith('front:frame')).length, 1);
        check('tagged as a ceiling close', (calls.find(c => c.startsWith('front')) || '').includes('ceiling'), true);
        check('the silent tiles are still held', Object.keys(cp.heldFrames), ['back', 'left']);
        check('and no tile was uncovered into a gap', calls.filter(c => c.startsWith('back') || c.startsWith('left')).length, 0);

        // 4. A start asked for inside the gate is remembered and run when it comes down.
        calls.length = 0;
        p = rewire(['front']);
        await realPlay.call(cp);
        check('playAll() inside a gate deferred itself', cp.seam ? cp.seam.resume : false, true);
        check('and started nothing on its own', calls.filter(c => c === 'play').length, 0);
        cp.playAll = async function () { calls.push('play'); };
        one = present(p);
        one('front');
        check('the gate ran the deferred start', calls.filter(c => c === 'play').length, 1);

        // 5. A superseded splice must not start playback itself, but it must not swallow the request
        //    either — otherwise the second boundary leaves the grid frozen.
        calls.length = 0;
        p = rewire(['front']);
        await realPlay.call(cp);
        cp.holdFeedFrames([]);
        check('a superseded gate did not start playback itself', calls.filter(c => c === 'play').length, 0);
        check('but it carried the request forward', cp.seamResume, true);
        p = rewire(['back'], { keepResume: true });
        check('the next gate owns the deferred start', cp.seam.resume, true);
        check('and adopting it cleared the ledger', cp.seamResume, false);
        one = present(p);
        one('back');
        check('closing that gate finally starts playback', calls.filter(c => c === 'play').length, 1);

        // 5b. A splice with nothing to photograph has no gate to hand the request to, so it plays now.
        calls.length = 0;
        cp.heldFrames = {};
        cp.seamResume = true;
        cp.openSeamGate();
        check('no snapshot -> no gate', cp.seam, null);
        check('and the held start was not lost', calls.filter(c => c === 'play').length, 1);

        // 6. Desktop: no snapshot, so no gate, and `playAll` is never delayed BY THE GATE.
        //    The first version of this asserted `await playAll() < 500ms`. Measured on the AVD with the
        //    six tiles left alone (no probe, `seam=null`), that same await took 2647, 0 and 1604 ms —
        //    `playAll` resolves on `Promise.all` of the media elements' own `play()` promises, so the
        //    number is how much data the emulator has, and it was green before only because the buffers
        //    happened to be deep. What R79 can actually delay is the *dispatch*: with a gate open,
        //    `playAll` returns at the `if (this.seam)` branch and no tile is told to play at all.
        //    So measure the dispatch, and keep the control that makes it non-vacuous (6c).
        calls.length = 0;
        cp.seamResume = false;
        cp.heldFrames = {};
        window.isTouchShellRuntime = () => false;
        cp.holdFeedFrames(['front']);
        cp.openSeamGate();
        check('desktop armed no snapshot', Object.keys(cp.heldFrames).length, 0);
        check('desktop opened no gate', cp.seam, null);
        window.isTouchShellRuntime = save.tsr;
        cp.playAll = save.play;
        // The awaited `playAll` below takes 11 s on the emulator (it resolves on the media elements'
        // own `play()` promises). That is long enough for the app itself to reach a real segment
        // boundary and open a real gate while the bench still has `heldFrames` mocked — and a gate
        // makes `playAll` defer on purpose, which reads here as "dispatched nothing". Block reopening
        // for the duration of this one call and count how often the app asked.
        const realOpen = cp.openSeamGate;
        let reopenAsked = 0;
        cp.openSeamGate = function (...args) {
            if (cp.seam) return;
            reopenAsked++;
            return undefined;
        };
        cp.seam = null;
        const fired = fireSpy.arm();
        const eligibleBefore = Object.keys(cp.players).filter(k => cp.players[k] && cp.players[k].src && !cp.suspendedFeeds.has(k));
        try {
            await cp.playAll();
            const t = fired.times();
            // The first version bounded each dispatch at 50 ms. Measured twice on the same build:
            // standalone the six `play()` calls land at 0.7/2.5/3.9/4.6/5.4/12.9 ms, run behind this
            // bench's 29 other checks at 0.5/12.4/26.6/35.2/61.7/81.7 ms. A video element's `play()`
            // does real synchronous work when six concurrent loads start, so the spread is emulator
            // load — the very thing the comment above this check refuses to measure.
            // What the gate can actually change is whether a tile is told to play AT ALL, so count
            // dispatches against the tiles `playAll` itself considers eligible. 6c keeps it non-vacuous.
            const ok = t.length >= 1 && t.length === eligibleBefore.length;
            results.push({
                name: 'desktop: every visible tile was told to play synchronously', pass: ok, got: ok, want: true,
                ctx: {
                    marks: t.map(ms => +ms.toFixed(1)), eligibleBefore, eligibleCount: eligibleBefore.length,
                    dispatches: t.length, reopenAsked,
                    srcNow: Object.keys(cp.players).filter(k => cp.players[k] && cp.players[k].src),
                    seamNow: cp.seam ? 'OPEN' : null,
                    // Anything the bench mocked away would explain a zero without implicating the app.
                    playersPatched: Object.keys(cp.players).filter(k => cp.players[k] && Object.prototype.hasOwnProperty.call(cp.players[k], 'play')),
                },
            });
        } finally {
            fireSpy.disarm();
            cp.openSeamGate = realOpen;
        }
        if (reopenAsked) console.warn('r79-gate: blocked', reopenAsked, 'real gate open(s) during check 6');

        // 6c. Control: on a phone with the gate open the same call must NOT dispatch. Without this the
        //     assertion above passes simply because the spy can't see anything.
        calls.length = 0;
        cp.heldFrames = { front: fakeHold() };
        cp.seamResume = false;
        cp.openSeamGate();
        const onPhone = !!cp.seam;
        const gated = onPhone ? fireSpy.arm() : null;
        if (gated) {
            try {
                await cp.playAll();
                check('phone with an open gate dispatches no play()', gated.times().length, 0);
                check('and remembers the request instead', cp.seam ? cp.seam.resume : null, true);
            } finally {
                gated.disarm();
                cp.closeSeamGate('probe-end');
                cp.seamResume = false;
                cp.heldFrames = {};
            }
        } else {
            check('the phone gate opened on the bench', false, true);
        }
    } finally {
        cp.closeSeamGate('probe-end');
        Object.keys(cp.heldFrames).forEach(cam => { if (cp.heldFrames[cam].canvas.remove) cp.heldFrames[cam].canvas.remove(); });
        cp.heldFrames = save.held;
        cp.seam = save.seam;
        cp.seamResume = save.resume;
        cp.releaseHeldFrame = save.release;
        cp.playAll = save.play;
        window.isTouchShellRuntime = save.tsr;
        // The real method logged fake rows into the diagnostics ledger while the probe ran.
        cp.holdLog.splice(save.logLen);
        if (save.playing) cp.playAll();
    }
    const failed = results.filter(r => !r.pass);
    const report = JSON.stringify({
        verdict: failed.length ? 'FAIL' : 'PASS',
        passed: results.length - failed.length, total: results.length,
        failures: failed,
    }, null, 1);
    // `await cp.playAll()` inside the bench can outlast the CDP request, so keep the answer readable
    // from a second call instead of only in the (possibly lost) return value.
    window.__r79gate = report;
    return report;
})();
