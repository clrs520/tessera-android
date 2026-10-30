(() => {
    const items = [...document.querySelectorAll('header button, .main-header button, [class*="hamburger"]')]
        .map((e) => {
            const b = e.getBoundingClientRect();
            return {
                id: e.id,
                cls: (e.className || '').toString().slice(0, 34),
                label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 18),
                x: Math.round(b.left + b.width / 2),
                y: Math.round(b.top + b.height / 2),
                w: Math.round(b.width),
                h: Math.round(b.height),
            };
        })
        .filter((r) => r.w > 0 && r.h > 0);
    return JSON.stringify(items, null, 1);
})()
