(() => {
    const cp = viewer.continuousPlayer, p = viewer.multiCameraPlayer;
    const b = cp.viewer?.dom?.playerArea?.getBoundingClientRect?.();
    const band = viewer.pictureGestureBand ? viewer.pictureGestureBand() : null;
    const r = (x) => x === undefined || x === null ? null : Math.round(x);
    return {
        vw: innerWidth, vh: innerHeight,
        layout: p.layoutMode, active: p.activeCamera, flag: p.isPlaying,
        paused: p.players.front.paused,
        ct: +cp.getCurrentTime().toFixed(2), seg: cp.currentSegmentIndex,
        total: +cp.totalDuration.toFixed(2),
        area: b ? [r(b.left), r(b.top), r(b.width), r(b.height)] : null,
        band: band ? [r(band.left), r(band.top), r(band.width)] : null,
        banner: document.getElementById('jsErrorBanner')?.style.display !== 'none'
    };
})()
