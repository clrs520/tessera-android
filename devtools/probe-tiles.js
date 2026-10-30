// Tile geometry for the pinch test: where each feed is, and the free bands around it.
(() => {
    const tiles = [...document.querySelectorAll('.video-container')].map(c => {
        const r = c.getBoundingClientRect();
        const v = c.querySelector('video');
        return {
            label: (c.querySelector('.camera-label') || {}).textContent?.trim().slice(0, 10),
            x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
            cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2),
            zoom: getComputedStyle(c).getPropertyValue('--feed-zoom').trim(),
            videoTransform: v ? getComputedStyle(v).transform : null,
        };
    });
    return JSON.stringify({
        grid: document.querySelector('.player-area').className,
        pageZoom: document.documentElement.style.zoom || 'none',
        tiles,
    }, null, 1);
})();
