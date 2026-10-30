(async () => {
    const m = window.viewer.multiCameraPlayer, f = m.players.front;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const a = { t: f.currentTime, paused: f.paused, isPlaying: m.isPlaying };
    await sleep(1000);
    const b = { t: f.currentTime, paused: f.paused, isPlaying: m.isPlaying };
    return JSON.stringify({ at0: a, at1s: b, advanced: +(b.t - a.t).toFixed(2),
        area: document.getElementById('playerArea').className.replace('player-area', '').trim() });
})();
