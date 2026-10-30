// Reproduce the flaky C failure and say what the state actually was when `.paused` refused to land.
// The claim to test: `pauseAll()` on a feed the seam gate already paused fires no `pause` event, so
// `updatePlayState(false)` never runs and the area keeps its playing-shaped class list.
(async () => {
    const v = window.viewer;
    const m = v.multiCameraPlayer;
    const area = document.getElementById('playerArea');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const note = [];
    const snap = (tag) => {
        const feeds = Object.fromEntries(Object.entries(m.players || {})
            .filter(([, p]) => p && p.src)
            .map(([k, p]) => [k, `${p.paused ? 'P' : 'p'}${p.ended ? 'E' : ''}@${(p.currentTime || 0).toFixed(1)}`]));
        note.push({
            tag,
            isPlaying: m.isPlaying,
            gate: m.seamGateState || m._seamGate || (m.holdGate ? 'held' : 'unknown'),
            holds: (v.multiCameraPlayer.describeHolds ? v.multiCameraPlayer.describeHolds().length : -1),
            area: area.className.replace('player-area', '').trim(),
            prev: getComputedStyle(document.getElementById('prevFrameBtn')).display,
            feeds
        });
    };
    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || v.eventGroups[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    snap('opened');
    document.getElementById('nextEventBtn').click();
    await sleep(1500);
    snap('next event');
    document.getElementById('prevEventBtn').click();
    await sleep(1500);
    snap('back to first');
    await m.playAll();
    await sleep(300);
    snap('after playAll');
    await m.pauseAll();
    await sleep(300);
    snap('300ms after pauseAll');
    await sleep(1200);
    snap('1.5s after pauseAll');
    // and what a real press does from exactly this state
    document.getElementById('playPauseBtn').click();
    await sleep(900);
    snap('press from here');
    document.getElementById('playPauseBtn').click();
    await sleep(900);
    snap('press again');
    return JSON.stringify(note, null, 1);
})();
