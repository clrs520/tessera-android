(() => {
    const v = window.viewer;
    const card = document.querySelector('#fileList .video-card');
    const badge = document.getElementById('clipLoadingBadge');
    return JSON.stringify({
        card: card ? (() => { const b = card.getBoundingClientRect();
            return { id: card.dataset.eventId, x: +(b.x + b.width / 2).toFixed(1), y: +(b.y + b.height / 2).toFixed(1), w: +b.width.toFixed(1) }; })() : null,
        current: v.currentEvent ? v.currentEvent.eventId : null,
        loadingId: v.playEventLoadingId || null,
        badgeShown: badge.classList.contains('show'),
        touchShell: document.documentElement.classList.contains('touch-ui'),
    });
})()
