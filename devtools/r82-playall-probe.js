// Same as r82-playall-probe, but the answer lands in window.__r82pa because `await cp.playAll()`
// on the emulator can outlast the CDP request.
(async () => {
    const cp = window.viewer && window.viewer.multiCameraPlayer;
    if (!cp) { window.__r82pa = { err: 'no player' }; return 'started'; }
    const out = { state: 'running' };
    window.__r82pa = out;
    out.seamBefore = cp.seam ? 'OPEN' : null;
    out.heldBefore = Object.keys(cp.heldFrames || {});
    out.suspended = [...(cp.suspendedFeeds || [])];
    out.players = Object.keys(cp.players);
    out.withSrc = out.players.filter(k => cp.players[k] && cp.players[k].src);
    out.eligible = out.withSrc.filter(k => !cp.suspendedFeeds.has(k));
    const t0 = performance.now();
    const marks = [];
    Object.values(cp.players).forEach(p => {
        if (!p) return;
        const orig = p.play.bind(p);
        p.play = () => { marks.push(+(performance.now() - t0).toFixed(1)); return orig(); };
    });
    try {
        await cp.playAll();
    } catch (e) {
        out.threw = String(e && e.message || e);
    } finally {
        Object.values(cp.players).forEach(p => { if (p) delete p.play; });
    }
    out.marks = marks;
    out.awaitMs = Math.round(performance.now() - t0);
    out.verdict = marks.length >= 1 && marks.every(ms => ms < 50) ? 'PASS' : 'FAIL';
    out.state = 'done';
    return 'started';
})();
