(() => {
    const vc = window.viewer.videoControls;
    const bar = vc.progressContainer;
    return JSON.stringify({
        trace: window.__r169trace || [],
        valueNow: Number(bar.getAttribute('aria-valuenow')),
        dragging: vc.isDragging,
        current: window.viewer.continuousPlayer.getCurrentTime(),
        total: window.viewer.continuousPlayer.getTotalDuration(),
        timeLabel: vc.videoTimeDisplay.textContent,
    });
})()
