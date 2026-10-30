// Widths of the control row in both states, so the overflow is a number and not an impression.
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const area = document.getElementById('playerArea');
    const row = document.querySelector('.video-controls') || document.querySelector('.controls-left')?.parentElement;
    const ids = ['prevEventBtn', 'playPauseBtn', 'prevFrameBtn', 'nextFrameBtn', 'nextEventBtn',
        'videoTimeDisplay', 'layoutBtn', 'fullscreenBtn', 'clipBtn', 'speedBtn'];
    const grab = () => {
        const out = { row: row.className, rowW: Math.round(row.getBoundingClientRect().width),
            rowScrollW: row.scrollWidth, vw: innerWidth, items: {} };
        ids.forEach(id => {
            const n = document.getElementById(id);
            if (!n) { out.items[id] = 'missing'; return; }
            const b = n.getBoundingClientRect();
            out.items[id] = getComputedStyle(n).display === 'none' ? 'none'
                : `${Math.round(b.left)}..${Math.round(b.right)}${b.right > innerWidth + 1 ? ' OFF' : ''}`;
        });
        return out;
    };
    for (let i = 0; i < 8 && area.classList.contains('paused'); i += 1) {
        document.getElementById('playPauseBtn').click(); await sleep(450);
    }
    v.videoControls.showControls(); await sleep(300);
    const playing = grab();
    for (let i = 0; i < 8 && !area.classList.contains('paused'); i += 1) {
        document.getElementById('playPauseBtn').click(); await sleep(450);
    }
    v.videoControls.showControls(); await sleep(300);
    const paused = grab();
    return JSON.stringify({ playing, paused }, null, 1);
})();
