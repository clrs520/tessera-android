// The flags are not the picture. Sample what the reference element is doing every 200 ms for 9 s
// while the driver lands real fingers inside the window, and print only the transitions — so
// 「我按了暂停，画面到底停没停」 is answered by `currentTime` and not by `multiCameraPlayer.isPlaying`.
(async () => {
    const v = window.viewer;
    const m = v.multiCameraPlayer;
    const el = () => m.players.front;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const t0 = Date.now();
    const rows = [];
    let prev = null;
    for (let i = 0; i < 45; i += 1) {
        const p = el();
        const cur = `${p ? (p.paused ? 'PAUSED' : 'run') : 'gone'} ${((p && p.currentTime) || 0).toFixed(2)}`
            + ` flag=${m.isPlaying}`
            + ` ev=${String(v.currentEvent?.eventId || '-').split('/').pop().slice(-12)}`;
        if (cur !== prev) {
            rows.push(`+${String(Date.now() - t0).padStart(5)}ms  ${cur}  area=`
                + document.getElementById('playerArea').className
                    .replace(/\bplayer-area\b|\blegacy-view\b/g, '').replace(/\s+/g, ' ').trim());
            prev = cur;
        }
        await sleep(200);
    }
    return rows.join('\n');
})();
