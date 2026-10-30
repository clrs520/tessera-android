(() => {
    const r = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)];
    };
    const plate = document.getElementById('metaDetailOverlay');
    const content = plate && plate.querySelector('.stats-content');
    const rows = content ? [...content.querySelectorAll('.stats-row')] : [];
    const tabs = [...document.querySelectorAll('.tab-btn')].map((e) => e.getBoundingClientRect());
    const overflowing = [...document.querySelectorAll('body *')]
        .filter((e) => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && (b.right > innerWidth + 2 || b.left < -2)
                && getComputedStyle(e).position !== 'fixed'
                && !/overlay|modal|sidebar|toast/i.test(e.className + '');
        })
        .slice(0, 6)
        .map((e) => (e.id ? '#' + e.id : '.' + (e.className || '').toString().split(' ')[0]) + ' ' + Math.round(e.getBoundingClientRect().right));
    return JSON.stringify({
        vp: [innerWidth, innerHeight, Math.round(devicePixelRatio * 1000) / 1000],
        hOverflow: document.documentElement.scrollWidth - innerWidth,
        vOverflow: document.documentElement.scrollHeight - innerHeight,
        docScrollW: document.documentElement.scrollWidth,
        tabs: { n: tabs.length, rects: tabs.map((b) => [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]), onScreen: tabs.every((b) => b.bottom <= innerHeight + 1 && b.right <= innerWidth + 1 && b.left >= -1) },
        minTouch: [...document.querySelectorAll('button')]
            .filter((e) => e.offsetParent)
            .map((e) => { const b = e.getBoundingClientRect(); return { t: (e.getAttribute('aria-label') || e.textContent || e.id).trim().replace(/\s+/g, ' ').slice(0, 12), w: Math.round(b.width), h: Math.round(b.height) }; })
            .filter((x) => x.w > 0 && (x.w < 40 || x.h < 40)).slice(0, 8),
        plate: { rect: r(plate), shown: plate && plate.classList.contains('show'), dense: plate && plate.classList.contains('stats-dense'), fits: content ? content.scrollHeight <= content.clientHeight + 1 : null, clipped: rows.filter((x) => x.getBoundingClientRect().bottom > content.getBoundingClientRect().bottom + 1).length },
        player: r(document.getElementById('playerArea')),
        overflowing,
        errors: (window.viewer && window.viewer.recentErrors ? window.viewer.recentErrors.length : 0),
        bannerShown: document.getElementById('jsErrorBanner') ? document.getElementById('jsErrorBanner').style.display !== 'none' : null,
    }, null, 1);
})()
