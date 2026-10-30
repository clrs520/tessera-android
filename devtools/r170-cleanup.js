(() => {
    const v = window.viewer;
    if (v.__r170origToast) { v.showToast = v.__r170origToast; delete v.__r170origToast; }
    window.__r170toasts = [];
    const vc = v.videoControls;
    vc.setTotalDuration(v.continuousPlayer.getTotalDuration());
    if (v.currentEvent) vc.addEventMarkers(v.currentEvent);
    return JSON.stringify({ restored: true });
})()
