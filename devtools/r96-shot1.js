// park the app in the state the first screenshot should show: playing, bar up, nothing hidden
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || v.eventGroups[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 30 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    for (let i = 0; i < 25 && (!v.multiCameraPlayer.isPlaying || v.multiCameraPlayer.players.front.paused); i += 1) await sleep(200);
    v.videoControls.showControls();
    return JSON.stringify({ playing: v.multiCameraPlayer.isPlaying, area: document.getElementById('playerArea').className });
})();
