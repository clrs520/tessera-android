(async () => {
    const v = window.viewer, m = v.multiCameraPlayer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const area = document.getElementById('playerArea');
    for (let i = 0; i < 6 && !area.classList.contains('paused'); i += 1) {
        document.getElementById('playPauseBtn').click();
        await sleep(500);
    }
    v.videoControls.showControls();
    return JSON.stringify({ paused: area.classList.contains('paused'),
        prev: getComputedStyle(document.getElementById('prevFrameBtn')).display,
        next: getComputedStyle(document.getElementById('nextFrameBtn')).display });
})();
