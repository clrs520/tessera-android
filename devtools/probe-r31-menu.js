(() => {
    const cands = [...document.querySelectorAll('button, [role="button"], .icon-btn')]
        .filter((e) => /menu|burger|hambug|hambur|sidebar|toggle|drawer/i.test(e.id + ' ' + e.className))
        .map((e) => {
            const b = e.getBoundingClientRect();
            return {
                id: e.id,
                cls: (e.className || '').toString().slice(0, 40),
                label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 16),
                x: Math.round(b.left + b.width / 2),
                y: Math.round(b.top + b.height / 2),
                w: Math.round(b.width),
                pe: getComputedStyle(e).pointerEvents,
            };
        })
        .filter((r) => r.w > 0);
    return JSON.stringify(cands, null, 1);
})()
