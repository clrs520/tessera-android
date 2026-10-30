(() => {
    const b = viewer.dom.playerArea.getBoundingClientRect();
    return JSON.stringify({
        vw: innerWidth,
        vh: innerHeight,
        touch: document.documentElement.classList.contains('touch-ui'),
        dir: viewer.currentDirectory || viewer.currentDir || null,
        cards: document.querySelectorAll('.video-card').length,
        ev: viewer.currentEvent ? viewer.currentEvent.id : null,
        layout: viewer.multiCameraPlayer.layoutMode,
        active: viewer.multiCameraPlayer.activeCamera,
        flag: viewer.multiCameraPlayer.isPlaying,
        area: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]
    });
})()
