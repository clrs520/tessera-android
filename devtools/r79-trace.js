// R79 (throwaway): arm a trace on the seam gate's four entry points and leave it running.
// The live 1.2.119 log shows five tiles handed back in one turn (identical `ref`) whose tag claims
// `ceiling 0/1 3ms` — the release was right, the ledger about *which* gate did it is not. This records
// every open/close/ready/arm with its gen, so the sequence can be read instead of inferred.
// Re-running just adds another wrapper, so run it once per page load.
(() => {
    const cp = window.viewer && window.viewer.multiCameraPlayer;
    if (!cp) return 'NO-VIEWER';
    if (cp.__r79traced) return 'already traced';
    window.__r79trace = [];
    const tr = (ev, extra) => {
        window.__r79trace.push(Object.assign({ ev, t: Math.round(performance.now()) }, extra || {}));
        if (window.__r79trace.length > 200) window.__r79trace.shift();
    };
    const s = () => {
        const q = cp.seam;
        return q ? `g${q.gen} need=[${Array.from(q.need).join(',')}] ready=[${Array.from(q.ready).join(',')}] resume=${q.resume} age=${Math.round(performance.now() - q.openedAt)}` : 'none';
    };
    cp.__r79orig = { open: cp.openSeamGate, close: cp.closeSeamGate, ready: cp.markSeamReady, arm: cp.holdFeedFrames, rel: cp.releaseHeldFrame };
    cp.openSeamGate = function () { const before = s(); const r = cp.__r79orig.open.apply(this, arguments); tr('open', { before, after: s() }); return r; };
    cp.closeSeamGate = function (why) {
        const q = cp.seam;
        const r = cp.__r79orig.close.apply(this, arguments);
        tr('close', { why, was: q ? `g${q.gen} need=${q.need.size} ready=${q.ready.size} age=${Math.round(performance.now() - q.openedAt)}` : 'none', now: s(), held: Object.keys(cp.heldFrames) });
        return r;
    };
    cp.markSeamReady = function (cam) { const r = cp.__r79orig.ready.apply(this, arguments); tr('ready', { cam, now: s() }); return r; };
    cp.holdFeedFrames = function () { const r = cp.__r79orig.arm.apply(this, arguments); tr('arm', { want: arguments[0], held: Object.keys(cp.heldFrames), seam: s() }); return r; };
    cp.releaseHeldFrame = function (cam, why) { tr('release', { cam, why, gate: cp.heldFrames[cam] && cp.heldFrames[cam].gate, seam: s() }); return cp.__r79orig.rel.apply(this, arguments); };
    cp.__r79traced = true;
    return 'traced';
})();
