// R138 专项探针：跨段 hold/gate 不再等隐藏的 front；hold 层级；前 5 秒退出清旧记录。
(async () => {
    const v = window.viewer;
    const p = v.multiCameraPlayer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 20 && !v.currentEvent; i += 1) await sleep(300);
    if (!v.currentEvent) return JSON.stringify({ error: 'no event' });

    p.setCamera('right');
    p.setLayout('single');
    await sleep(500);
    const seg = v.currentEvent.segments[0];
    const pr = p.loadSegmentForAllCameras(seg);
    await sleep(120);
    const held = Object.keys(p.heldFrames);
    const need = p.seam ? [...p.seam.need] : null;
    const hold = p.playerContainers.right?.querySelector('.feed-hold');
    const z = hold ? getComputedStyle(hold).zIndex : null;
    const frontDisplay = getComputedStyle(p.playerContainers.front).display;
    await pr;
    await sleep(300);

    // Resume clear: write a fake old entry, land at 2 s, save the position, then read it back.
    const id = v.currentEvent.eventId;
    const key = 'tdashcam.playbackPos';
    localStorage.setItem(key, JSON.stringify({ [id]: { i: 0, t: 30 } }));
    await v.continuousPlayer.seekToTime(2);
    await sleep(600);
    v.rememberPlaybackPosition();
    let map = {};
    try { map = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { map = {}; }
    const cleared = !map[id];

    return JSON.stringify({
        held, need, holdZ: z, frontDisplay,
        resumeCleared: cleared,
        at: +v.continuousPlayer.getCurrentTime().toFixed(2),
        total: +v.continuousPlayer.getTotalDuration().toFixed(2),
    });
})()
