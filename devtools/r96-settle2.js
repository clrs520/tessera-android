(async () => {
    const v = window.viewer, m = v.multiCameraPlayer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const out = [];
    const el = () => m.players.front;
    const snap = tag => out.push(`${tag} el=${el() ? (el().paused ? 'PAUSED' : 'run') : 'gone'} t=${(el()?.currentTime || 0).toFixed(2)} flag=${m.isPlaying} icon=${v.videoControls.playPauseIcon ? 'set' : 'none'} area=${document.getElementById('playerArea').className.replace('player-area legacy-view', '').trim()}`);
    window.__r96snap = { snap, out, sleep, el };
    snap('start');
    return 'armed';
})();
