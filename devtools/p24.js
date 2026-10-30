(() => {
    const band = viewer.pictureGestureBand();
    const taps = window.__taps || [];
    const seen = {};
    taps.forEach(t => { seen[t.x] = (seen[t.x] || 0) + 1; });
    return JSON.stringify({
        band: band ? [Math.round(band.left), Math.round(band.width), Math.round(band.right)] : null,
        tapXs: seen,
        steps: (window.__steps || []).map(s => ({ dir: s.dir, band: s.band })),
        camSteps: window.__camSteps || [],
        chips: window.__chips || [],
        applies: (window.__seeklog || []).filter(e => e.ev === 'apply')
            .map(e => ({ ms: e.ms, seg: e.seg, d: +(e.want - e.from).toFixed(1), p: e.paused })),
        ct: +viewer.continuousPlayer.getCurrentTime().toFixed(1),
        paused: document.querySelector('#front-player').paused,
        flag: viewer.videoControls.isPlaying,
        zoomed: document.body.classList.contains('camera-zoomed'),
        cam: viewer.multiCameraPlayer.activeCamera,
        layout: viewer.multiCameraPlayer.layoutMode,
    }, null, 1);
})()
