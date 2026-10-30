// park: playing, bar up — the state a person sees the new 上/下一条 in
(async () => {
    const v = window.viewer, m = v.multiCameraPlayer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || v.eventGroups[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 30 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    for (let i = 0; i < 30 || !v.videoControls.totalDuration; i += 1) await sleep(200);
    for (let i = 0; i < 30 && (m.players.front.paused || !m.isPlaying); i += 1) await sleep(200);
    v.videoControls.showControls();
    return JSON.stringify({ playing: m.isPlaying, el: m.players.front.paused ? 'paused' : 'running',
        ev: (v.currentEvent?.eventId || '').split('/').pop() });
})();
