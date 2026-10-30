(() => {
    const c = document.querySelector('.video-card');
    if (!c) return 'no card';
    const b = c.getBoundingClientRect();
    return JSON.stringify({
        id: c.dataset.eventId || c.dataset.id,
        tapX: Math.round((b.left + b.width / 2) * devicePixelRatio),
        tapY: Math.round((b.top + Math.min(b.height / 2, 60)) * devicePixelRatio),
        css: { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) },
        vib: window.__vib,
    }, null, 1);
})()
