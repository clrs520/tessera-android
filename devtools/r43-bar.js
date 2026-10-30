(() => {
    const b = [...document.querySelectorAll('.phone-action-bar button, .phone-action-bar [role=button]')].map(e => {
        const r = e.getBoundingClientRect(); return { t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 6), x: Math.round((r.x + r.width / 2) * devicePixelRatio), y: Math.round((r.y + r.height / 2) * devicePixelRatio) };
    });
    return JSON.stringify(b);
})()
