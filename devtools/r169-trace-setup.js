(async () => {
    const v = window.viewer;
    const vc = v.videoControls;
    v.dom.playerArea.classList.remove('empty');
    v.multiCameraPlayer.pauseAll();
    const total = v.continuousPlayer.getTotalDuration() || 7;
    vc.setTotalDuration(total);
    vc.addGapMarkers({ segmentGaps: [6], segmentStartTimes: [0], segmentDurations: [total * 0.35] });
    vc.showControls();
    vc.resetHideTimer();
    const bar = vc.progressContainer;
    window.__r169trace = [];
    window.__r169listeners && window.__r169listeners.forEach(([t, f]) => bar.removeEventListener(t, f, true));
    window.__r169listeners = [];
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchend']) {
        const fn = (e) => window.__r169trace.push([type, e.pointerType || '', Math.round(e.clientX || 0), Math.round(e.clientY || 0), vc.isDragging, bar.getAttribute('aria-valuenow')]);
        bar.addEventListener(type, fn, true);
        window.__r169listeners.push([type, fn]);
    }
    const r = bar.getBoundingClientRect();
    const tick = bar.querySelector('.gap-marker:not(.minor)');
    const tb = tick.getBoundingClientRect();
    return JSON.stringify({
        total, bar: { x: r.left, y: r.top, w: r.width, h: r.height },
        from: { x: tb.left + tb.width / 2, y: r.top + r.height / 2 },
        to: { x: r.left + r.width * 0.66, y: r.top + r.height / 2 },
        valueNow: Number(bar.getAttribute('aria-valuenow')),
        dpr: devicePixelRatio,
        point: (() => { const n = document.elementFromPoint(tb.left + tb.width / 2, r.top + r.height / 2); return n ? `${n.tagName}.${n.className}` : 'none'; })(),
    });
})()
