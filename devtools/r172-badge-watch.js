(() => {
    const v = window.viewer;
    const badge = document.getElementById('clipLoadingBadge');
    const log = [];
    const t0 = performance.now();
    return new Promise((resolve) => {
        const tick = () => {
            log.push(`${Math.round(performance.now() - t0)}ms show=${badge.classList.contains('show')}`
                + ` left=${badge.style.left || '-'} loading=${v.playEventLoadingId ? 'Y' : 'n'}`
                + ` cur=${v.currentEvent ? 'set' : 'none'}`);
            if (performance.now() - t0 < 3200) setTimeout(tick, 160);
            else resolve(JSON.stringify({ log, current: v.currentEvent?.eventId || null }));
        };
        tick();
    });
})()
