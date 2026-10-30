// Why does `C pausing reveals the frame pair` still read no `.paused`? Print the whole chain — the
// element, the flags, the class, and the button — before and after one real press.
(async () => {
    const v = window.viewer;
    const m = v.multiCameraPlayer;
    const area = document.getElementById('playerArea');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const snap = (tag) => {
        const f = m.players && m.players.front;
        return {
            tag,
            vcPlaying: v.videoControls.isPlaying,
            mPlaying: m.isPlaying,
            elPaused: f ? f.paused : 'no front',
            elTime: f ? Number((f.currentTime || 0).toFixed(2)) : null,
            layout: m.currentLayout,
            area: area.className,
            prev: getComputedStyle(document.getElementById('prevFrameBtn')).display,
            next: getComputedStyle(document.getElementById('nextFrameBtn')).display
        };
    };
    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || v.eventGroups[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    await m.playAll();
    await sleep(1200);
    const r = [snap('after playAll')];
    document.getElementById('playPauseBtn').click();
    await sleep(800);
    r.push(snap('1 press'));
    document.getElementById('playPauseBtn').click();
    await sleep(800);
    r.push(snap('2 presses'));
    document.getElementById('playPauseBtn').click();
    await sleep(1500);
    r.push(snap('3 presses'));
    return JSON.stringify(r, null, 1);
})();
