(async () => {
    const r = id => {
        const b = document.getElementById(id).getBoundingClientRect();
        return [Math.round((b.left + b.right) / 2), Math.round((b.top + b.bottom) / 2)];
    };
    return JSON.stringify({
        dpr: window.devicePixelRatio,
        nextEvent: r('nextEventBtn'), playPause: r('playPauseBtn'),
        event: (window.viewer.currentEvent?.eventId || '').split('/').pop()
    });
})();
