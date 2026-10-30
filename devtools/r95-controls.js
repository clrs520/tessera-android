// R95: 「衔接处播放控件会弹出来一下，然后几秒钟后又消失」 — a claim about the overlay being *shown*
// without anyone asking. So this probe never touches the UI: it waits for the bar to auto-hide, then
// samples the one class that decides whether it is visible, and pairs every reveal with the last
// segment crossing. A reveal that follows a crossing by a couple of seconds, with no input in
// between, is the reported flash.
(async () => {
    const v = window.viewer;
    const m = v.multiCameraPlayer;
    const cp = v.continuousPlayer;
    const overlay = v.videoControls.overlay;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const now = () => Math.round(performance.now());

    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || (v.eventGroups || [])[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    m.setLayout('grid');
    await m.playAll();
    for (let i = 0; i < 40 && !m.isPlaying; i += 1) await sleep(250);

    // The probe's own `playAll()` just revealed the bar through the very path under test. Wait it out
    // so every later reveal is one nobody asked for.
    for (let i = 0; i < 60 && overlay.classList.contains('show'); i += 1) await sleep(250);
    const hidden = !overlay.classList.contains('show');

    const events = [];
    let lastSegAt = null;
    let prevShown = overlay.classList.contains('show');
    let prevSeg = cp.currentSegmentIndex;
    for (let i = 0; i < 900; i += 1) {
        await sleep(120);
        const shown = overlay.classList.contains('show');
        const seg = cp.currentSegmentIndex;
        const at = now();
        if (seg !== prevSeg) {
            lastSegAt = at;
            events.push({ kind: 'seg', at, from: prevSeg, to: seg, shown });
        }
        if (shown && !prevShown) {
            events.push({ kind: 'reveal', at, msSinceSeg: lastSegAt === null ? null : at - lastSegAt });
        }
        if (!shown && prevShown) events.push({ kind: 'hide', at });
        prevShown = shown;
        prevSeg = seg;
        if (events.filter(e => e.kind === 'seg').length >= 4) break;
    }

    const crossings = events.filter(e => e.kind === 'seg');
    // A reveal inside the splice window: the gate is open, or it came down within the last 3 s.
    const flashes = events.filter(e => e.kind === 'reveal'
        && e.msSinceSeg !== null && e.msSinceSeg >= -2500 && e.msSinceSeg <= 3000);
    return JSON.stringify({
        hiddenBeforeWatching: hidden,
        orientation: window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait',
        crossings: crossings.length,
        revealAtCrossing: flashes.length,
        reveals: events.filter(e => e.kind === 'reveal').length,
        hides: events.filter(e => e.kind === 'hide').length,
        seamOpen: !!m.seam,
        events: events.slice(0, 24),
    }, null, 1);
})();
