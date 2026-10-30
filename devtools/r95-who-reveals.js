// R95: the `splicing` guard did not stop the reveal, so the assumption about *who* reveals is wrong.
// Patch the one function that puts the class on and print the stack of every reveal across two
// boundaries, with the seam state at that instant. Diagnostic only — this file changes nothing.
(async () => {
    const v = window.viewer;
    const m = v.multiCameraPlayer;
    const vc = v.videoControls;
    const cp = v.continuousPlayer;
    const overlay = vc.overlay;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || (v.eventGroups || [])[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    m.setLayout('grid');
    await m.playAll();
    for (let i = 0; i < 40 && !m.isPlaying; i += 1) await sleep(250);
    for (let i = 0; i < 60 && overlay.classList.contains('show'); i += 1) await sleep(250);

    const reveals = [];
    const orig = vc.showControls.bind(vc);
    vc.showControls = () => {
        reveals.push({
            at: Math.round(performance.now()),
            splicing: !!m.splicing,
            seam: m.seam ? `${m.seam.ready.size}/${m.seam.need.size}` : null,
            held: Object.keys(m.heldFrames).length,
            isPlaying: !!vc.isPlaying,
            already: overlay.classList.contains('show'),
            stack: (new Error()).stack.split('\n').slice(1, 6).join(' <- ').replace(/https?:\/\/[^\s)]*/g, ''),
        });
        orig();
    };
    const seg0 = cp.currentSegmentIndex;
    for (let i = 0; i < 600 && cp.currentSegmentIndex === seg0; i += 1) await sleep(120);
    await sleep(6000);
    const seg1 = cp.currentSegmentIndex;
    for (let i = 0; i < 600 && cp.currentSegmentIndex === seg1; i += 1) await sleep(120);
    await sleep(6000);
    vc.showControls = orig;

    return JSON.stringify({
        crossings: `${seg0}->${cp.currentSegmentIndex}`,
        reveals: reveals.slice(0, 8),
        total: reveals.length,
    }, null, 1);
})();
