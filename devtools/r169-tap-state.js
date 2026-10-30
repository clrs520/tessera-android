(() => {
    const v = window.viewer;
    const vc = v.videoControls;
    const bar = vc.progressContainer;
    return JSON.stringify({
        current: v.currentEvent && v.currentEvent.eventId,
        active: [...document.querySelectorAll('#fileList .video-card.active')].map((c) => c.dataset.eventId),
        valueNow: Number(bar.getAttribute('aria-valuenow')),
        timeLabel: vc.videoTimeDisplay ? vc.videoTimeDisplay.textContent : null,
        scanning: !!v.isScanning,
        drawerOpen: !v.dom.sidebar.classList.contains('collapsed'),
        listTop: document.getElementById('fileList').scrollTop,
    });
})()
