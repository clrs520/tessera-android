// R77: a natural-playback run for the `lost` ledger — no forced seeks, because a seek storm inflates
// the corrector's numbers and the comparison against the 1.2.114 baseline would be meaningless.
(async () => {
    const v = window.viewer;
    const ev = (v.eventGroups || []).find(e => e.eventId === 'TeslaCam/RecentClips');
    if (!ev) return JSON.stringify({ err: 'no fixture event' });
    await v.playEvent(ev.eventId);
    v.multiCameraPlayer.setLayout('grid');
    await v.multiCameraPlayer.playAll();
    return JSON.stringify({ started: true, idx: v.continuousPlayer.currentSegmentIndex });
})();
