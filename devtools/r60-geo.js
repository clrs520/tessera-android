(() => {
    try {
        const cs = [...document.querySelectorAll('.video-container')].map(c => {
            const r = c.getBoundingClientRect();
            return {
                vis: r.width > 0,
                rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
                zoom: c.style.getPropertyValue('--feed-zoom') || '1',
                tf: getComputedStyle(c.querySelector('video') || c).transform.slice(0, 40),
            };
        });
        return JSON.stringify({
            layout: viewer.videoControls.layoutMode,
            single: document.querySelectorAll('.video-container')[0] &&
                getComputedStyle(document.querySelectorAll('.video-container')[0].parentElement).display,
            cs,
        });
    } catch (e) { return 'THREW ' + e.message; }
})()
