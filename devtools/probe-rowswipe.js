(() => {
    const rows = Array.from(document.querySelectorAll('.video-card'));
    const out = rows.map((c, i) => {
        const g = c.getBoundingClientRect();
        const b = c.querySelector('.row-swipe-delete');
        const bs = b ? b.getBoundingClientRect() : null;
        const thumb = c.querySelector('.video-thumbnail');
        return {
            i,
            swipeable: c.classList.contains('swipeable'),
            touchAction: getComputedStyle(c).touchAction,
            y: Math.round(g.y),
            height: Math.round(g.height),
            thumbTransform: thumb ? getComputedStyle(thumb).transform : null,
            thumbTransition: thumb ? getComputedStyle(thumb).transitionDuration : null,
            btn: b ? {
                text: b.textContent,
                x: Math.round(bs.x),
                width: Math.round(bs.width),
                background: getComputedStyle(b).backgroundColor,
                transition: getComputedStyle(b).transitionDuration,
                aria: b.getAttribute('aria-label'),
                opacity: getComputedStyle(b).opacity,
            } : null,
        };
    });
    return JSON.stringify(out, null, 1);
})()
