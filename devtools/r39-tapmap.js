(() => {
    const d = devicePixelRatio;
    const pts = {};
    document.querySelectorAll('.phone-action-bar button, .phone-action-bar [role="button"]').forEach((b, i) => {
        const r = b.getBoundingClientRect();
        pts['bar' + i] = {
            label: (b.textContent || '').trim().slice(0, 6),
            tap: [Math.round((r.left + r.width / 2) * d), Math.round((r.top + r.height / 2) * d)]
        };
    });
    const hero = document.querySelector('.empty-hero-btn');
    if (hero) {
        const r = hero.getBoundingClientRect();
        pts.hero = { label: (hero.textContent || '').trim().slice(0, 8), tap: [Math.round((r.left + r.width / 2) * d), Math.round((r.top + r.height / 2) * d)] };
    }
    const bar = document.querySelector('.phone-action-bar');
    const bs = bar && bar.getBoundingClientRect();
    return JSON.stringify({ d, barRect: bs ? { top: Math.round(bs.top), bottom: Math.round(bs.bottom) } : null, pts });
})()
