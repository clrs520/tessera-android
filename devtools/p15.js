(() => {
    const area = document.getElementById('playerArea');
    if (!area) return 'no area';
    window.__taps = [];
    area.addEventListener('pointerup', (e) => {
        window.__taps.push({
            t: Math.round(performance.now()),
            x: Math.round(e.clientX), y: Math.round(e.clientY),
            tgt: (e.target.id || e.target.className || e.target.tagName || '').toString().slice(0, 28),
            supp: Date.now() < (viewer.suppressPlayerTapUntil || 0),
            lay: viewer.multiCameraPlayer.layoutMode,
            act: viewer.multiCameraPlayer.activeCamera,
            ph: isPhoneLayout(),
            ev: !!viewer.currentEvent,
            blk: viewer.blocksFeedGesture(e.target),
        });
    }, true);
    return 'taplog';
})()
