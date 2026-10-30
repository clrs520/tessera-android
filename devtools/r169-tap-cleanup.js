(() => {
    const v = window.viewer;
    const vc = v.videoControls;
    vc.setTotalDuration(v.continuousPlayer.getTotalDuration());
    if (v.currentEvent) vc.addEventMarkers(v.currentEvent);
    return JSON.stringify({ total: vc.totalDuration, gaps: vc.progressContainer.querySelectorAll('.gap-marker').length });
})()
