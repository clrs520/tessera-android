(() => {
    const v = window.viewer;
    const vc = v.videoControls;
    const bar = vc.progressContainer;
    return JSON.stringify({
        valueNow: Number(bar.getAttribute('aria-valuenow')),
        timeLabel: vc.videoTimeDisplay.textContent,
        toasts: window.__r170toasts || [],
        current: v.continuousPlayer.getCurrentTime(),
        total: v.continuousPlayer.getTotalDuration(),
        overlay: vc.overlay.classList.contains('show'),
    });
})()
