// Why does a forced pass while everything is paused write nothing? `syncAllPlayers` has five early
// returns before `correctTouchFeed` (:5924 isSeeking, :5927 throttle, :5933 ref has no src, :5941
// referenceIsTrustworthy, :5952 suspended / :5954 no src or seeking). This stages the same paused
// alignment the R80 probe stages and reports which of those it is, instead of guessing.
(async () => {
    const v = window.viewer;
    const cp = v && v.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no multiCameraPlayer' });
    const f = cp.players.front, b = cp.players.back;
    const snap = () => ({
        isPlaying: cp.isPlaying, isSeeking: cp.isSeeking, active: cp.activeCamera,
        sinceSyncMs: Math.round(performance.now() - cp.lastSyncTime),
        f: { src: !!f.src, paused: f.paused, seeking: f.seeking, t: +f.currentTime.toFixed(2) },
        b: { src: !!b.src, paused: b.paused, seeking: b.seeking, t: +b.currentTime.toFixed(2) },
        susp: Array.from(cp.suspendedFeeds || []),
        backStats: JSON.parse(JSON.stringify(cp.feedStats.back || {})),
        refTrust: cp.referenceIsTrustworthy(f.currentTime, performance.now()),
        layout: cp.layoutMode,
    });
    const before = snap();
    const corrBefore = (cp.feedStats.back || {}).corrections;
    await cp.syncAllPlayers();
    const after = snap();
    return JSON.stringify({
        before, corrBefore, corrAfter: (cp.feedStats.back || {}).corrections,
        wrote: after.b.t,
        declinedAt: before.isSeeking ? 'isSeeking'
            : before.sinceSyncMs < 100 ? 'throttle'
            : !f.src ? 'no ref src'
            : before.refTrust === false ? 'referenceIsTrustworthy'
            : before.susp.includes('back') ? 'suspended'
            : before.b.seeking ? 'feed seeking'
            : (after.corrAfter > corrBefore ? 'ACTED' : 'gap under tolerance, or the stopped-tile branch'),
    });
})();
