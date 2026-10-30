(() => {
    const bar = document.querySelector('.phone-tab-bar, .bottom-tabs, #phoneTabBar, .tab-bar');
    const items = [...(bar ? bar.querySelectorAll('button, .tab-item, [data-tab]') : [])].map((e) => {
        const b = e.getBoundingClientRect();
        return {
            id: e.id,
            cls: (e.className || '').toString().slice(0, 40),
            label: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 18),
            x: Math.round(b.left + b.width / 2),
            y: Math.round(b.top + b.height / 2),
            w: Math.round(b.width),
        };
    }).filter(r => r.w > 0);
    return JSON.stringify({ bar: bar ? (bar.id || bar.className) : null, items, all: [...document.querySelectorAll('[class*="tab"]')].slice(0, 12).map(e => e.className.toString().slice(0, 40)) }, null, 1);
})()
