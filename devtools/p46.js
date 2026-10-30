(() => {
    // Geometry the R65 storm driver needs in CSS px: the picture band (for the ±10s double taps, which
    // only exist in single) and the transport slider (for the real scrubs, which exist in every
    // layout). Controls auto-hide, so wake the overlay before measuring.
    const rect = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)];
    };
    const overlay = document.querySelector('.video-controls-overlay');
    if (overlay && !overlay.classList.contains('show')) overlay.classList.add('show');
    const band = viewer.pictureGestureBand();
    const bar = document.getElementById('progressContainer');
    const b2 = bar ? bar.getBoundingClientRect() : null;
    return JSON.stringify({
        layout: viewer.multiCameraPlayer.layoutMode,
        band: band ? [Math.round(band.left), Math.round(band.width), Math.round(band.right)] : null,
        bandMidY: band ? Math.round((viewer.dom.playerArea.getBoundingClientRect().top
            + viewer.dom.playerArea.getBoundingClientRect().bottom) / 2) : null,
        bar: rect(bar), barMidY: b2 ? Math.round((b2.top + b2.bottom) / 2) : null,
        scrubXs: b2 ? [Math.round(b2.left + b2.width * 0.2), Math.round(b2.left + b2.width * 0.8)] : null,
        dpr: devicePixelRatio
    });
})()
