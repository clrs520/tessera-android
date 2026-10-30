// Real-finger acceptance recorder: sample the ⋮ row label, the toast, and the transport every 120 ms
// so one read after the tap shows the whole sequence (a scan lasts seconds; a single snapshot would
// catch whichever moment the CDP call happened to land on).
(() => {
    if (window.__r82stop) window.__r82stop();
    const out = { samples: [] };
    window.__r82tap = out;
    const t0 = performance.now();
    const id = setInterval(() => {
        const v = window.viewer;
        const cp = v && v.multiCameraPlayer;
        if (!v) return;
        const label = document.querySelector('#menuRefreshBtn .btn-text');
        const toast = document.querySelector('.toast');
        out.samples.push({
            ms: Math.round(performance.now() - t0),
            row: label ? label.textContent.trim() : '-',
            toast: toast ? toast.textContent.trim().slice(0, 30) : '-',
            ev: (v.currentEvent && v.currentEvent.eventId || '-').replace('TeslaCam/', ''),
            at: +(v.continuousPlayer.getCurrentTime() || 0).toFixed(2),
            play: !!cp.isPlaying,
            srcs: Object.keys(cp.players).filter(k => cp.players[k].src).length,
            clip: document.querySelector('#clipBtn').disabled,
            fs: document.querySelector('#fullscreenBtn').disabled,
            cam: cp.activeCamera,
            layout: cp.layoutMode,
        });
        if (out.samples.length > 400) window.__r82stop();
    }, 120);
    window.__r82stop = () => { clearInterval(id); out.samples.push({ ms: -1, row: 'recorder-stopped' }); };
    return 'armed';
})();
