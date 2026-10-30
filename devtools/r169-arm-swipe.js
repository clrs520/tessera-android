(async () => {
    const v = window.viewer;
    const vc = v.videoControls;
    v.multiCameraPlayer.pauseAll();
    const total = vc.totalDuration || v.continuousPlayer.getTotalDuration() || 60;
    // Put the playhead somewhere else so a drag that does nothing cannot pass by standing still.
    try { await v.continuousPlayer.seekToTime(total * 0.08); } catch (e) { /* reported by valueNow */ }
    vc.showControls();
    vc.resetHideTimer();
    const bar = vc.progressContainer;
    // A paused seek does not always emit `timeupdate`; without this the bar still shows the previous
    // swipe's 66% and the next probe would read a stale "before" value.
    for (let i = 0; i < 20; i += 1) {
        try { vc.updateProgress?.(); } catch (e) { /* older shell */ }
        const pct = v.continuousPlayer.getTotalDuration() > 0
            ? (v.continuousPlayer.getCurrentTime() / v.continuousPlayer.getTotalDuration()) * 100 : 0;
        if (Math.abs(Number(bar.getAttribute('aria-valuenow')) - pct) <= 3) break;
        await new Promise((r) => setTimeout(r, 50));
    }
    const r = bar.getBoundingClientRect();
    const node = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const tick = bar.querySelector('.gap-marker:not(.minor)');
    const tb = tick ? tick.getBoundingClientRect() : r;
    return JSON.stringify({
        overlayShown: vc.overlay.classList.contains('show'),
        bar: { x: r.left, y: r.top, w: r.width, h: r.height },
        from: { x: tb.left + tb.width / 2, y: r.top + r.height / 2 },
        to: { x: r.left + r.width * 0.66, y: r.top + r.height / 2 },
        valueNow: Number(bar.getAttribute('aria-valuenow')),
        center: node ? `${node.tagName}.${node.className}` : 'none',
        current: v.currentEvent && v.currentEvent.eventId,
    });
})()
