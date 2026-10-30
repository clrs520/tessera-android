// R74-3 regression check for the hold-lifetime fixes. Synchronous only (an `await` here
// intermittently times the CDP call out), and every injected override is undone before returning.
//
// Order matters twice over: `holdFeedFrames()` refuses to snapshot an element with no videoWidth,
// and BOTH cleanup() variants blank every player — so the two arms happen while the feed is still
// live, and the two cleanup calls come after them.
(() => {
    const m = viewer.multiCameraPlayer;
    const camera = 'front';
    const player = m.players[camera];
    const container = m.playerContainers[camera];
    const out = {};

    const state = () => ({ holds: Object.keys(m.heldFrames).length, overlays: container.querySelectorAll('.feed-hold').length });
    // Two preconditions, because a run that starts at the wrong instant reports all-zeros and *looks*
    // like four clean assertions. Measured on 1.2.113: fired during a six-way splice, `player.videoWidth`
    // was 0, so `holdFeedFrames()` skipped the snapshot and `arm()` produced no hold — every stage below
    // then correctly observed "nothing standing", which tests nothing. Refuse and let the caller retry.
    if (!player.videoWidth) return JSON.stringify({ VOID_RUN: `no metadata (vw=${player.videoWidth} rs=${player.readyState}) — retry when the feed is live` });
    if (Object.keys(m.heldFrames).length) return JSON.stringify({ VOID_RUN: `a splice is in flight (${Object.keys(m.heldFrames).length} holds standing) — retry after it settles` });
    const arm = () => {
        m.holdFeedFrames([camera]);
        m.awaitHeldFrameRelease(camera, player);
    };

    out.pre = Object.assign({ vw: player.videoWidth, readyState: player.readyState }, state());

    // Hole (b): an aborted previous load queues an `error` that arrives after the new src is already
    // loading again, when the load algorithm has reset `error` to null. Declining it must not also
    // unsubscribe the handler (the `{ once: true }` variant did — measured on 1.2.110).
    arm();
    out.armed = state();
    player.dispatchEvent(new Event('error'));
    out.spuriousErrorKeepsHold = state();
    Object.defineProperty(player, 'error', { configurable: true, value: { code: 4, message: 'synthetic' } });
    player.dispatchEvent(new Event('error'));
    out.realErrorReleases = state();
    delete player.error;

    // Hole (a): the splice's own call is cleanup(!!keep) and must leave the snapshot standing;
    // every other caller is saying "this clip is gone" and must take it down.
    arm();
    out.reArmed = state();
    m.cleanup(true);
    out.spliceCleanupKeeps = state();
    m.cleanup();
    out.externalCleanupReleases = state();

    out.final = Object.assign({ vw: player.videoWidth, error: player.error }, state());
    return JSON.stringify(out, null, 1);
})()
