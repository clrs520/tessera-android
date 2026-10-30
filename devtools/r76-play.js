// R76: put the app into the situation the user described — the one event whose 完整视频 is made of many
// one-minute files, all six feeds painted in a landscape grid, running.
(async () => {
    const v = window.viewer;
    const ev = (v.eventGroups || []).find(e => e.eventId === 'TeslaCam/RecentClips')
        || (v.eventGroups || []).sort((a, b) => b.segments.length - a.segments.length)[0];
    if (!ev) return JSON.stringify({ err: 'no event on disk' });
    await v.playEvent(ev.eventId);
    // Layout after playEvent: playEvent restores the stored layout itself, so setting it first loses.
    v.multiCameraPlayer.setLayout('grid');
    await v.multiCameraPlayer.playAll();
    const cp = v.continuousPlayer;
    return JSON.stringify({
        id: ev.eventId, segs: ev.segments.length, idx: cp.currentSegmentIndex,
        playing: cp.isPlaying, vis: v.multiCameraPlayer.visibleCameras().length,
        // What the timeline books per segment vs what the file actually is — the (c) term, up front.
        booked: (cp.segmentDurations || []).slice(0, 4),
        durs: Object.keys(v.multiCameraPlayer.players).map(k => {
            const p = v.multiCameraPlayer.players[k];
            return k + '=' + (isFinite(p.duration) ? p.duration.toFixed(2) : 'na');
        }),
        starts: (cp.segmentStartTimes || []).slice(0, 4)
    });
})()
