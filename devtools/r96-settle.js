// Sample the transport every 200 ms for 5 s around a real 下一条 tap, and again around a real 暂停
// tap, so the question 「按下去有没有反应」 is answered by the picture rather than by a flag.
(async () => {
    const v = window.viewer, m = v.multiCameraPlayer;
    const f = () => m.players.front;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const rows = [];
    const sample = (tag) => {
        const p = f();
        rows.push([tag, Date.now() % 100000,
            `el=${p ? (p.paused ? 'PAUSED' : 'running') : 'gone'} t=${(p?.currentTime || 0).toFixed(2)}`,
            `flag=${m.isPlaying}`, `area=${document.getElementById('playerArea').className.replace('player-area', '').replace('legacy-view', '').trim()}`].join(' | '));
    };
    return { rows, sleep, v, sample };
})();
