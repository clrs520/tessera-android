(() => {
    const mcp = window.viewer.multiCameraPlayer;
    const t = () => Object.fromEntries(Object.entries(mcp.players).map(([k, p]) => [k, {
        paused: p.paused, t: +p.currentTime.toFixed(2), rs: p.readyState,
    }]));
    return JSON.stringify({
        mode: mcp.layoutMode,
        active: mcp.activeCamera,
        visible: mcp.visibleCameras(),
        suspended: Array.from(mcp.suspendedFeeds),
        isPlaying: mcp.isPlaying,
        players: t(),
        labels: Array.from(document.querySelectorAll('.camera-label')).map(l => l.textContent + ':' + l.style.display),
        errorBanner: !!document.querySelector('.js-error-banner, #jsErrorBanner'),
    });
})()
