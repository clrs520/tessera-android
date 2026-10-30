(() => {
    const g = document.getElementById('headerActionsGroup');
    const kids = [...g.children].map(c => {
        const r = c.getBoundingClientRect();
        return { tag: c.tagName.toLowerCase(), id: c.id, cls: c.className, disp: getComputedStyle(c).display,
            x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
    return JSON.stringify({ disp: getComputedStyle(g).display, flexDir: getComputedStyle(g).flexDirection,
        wrap: getComputedStyle(g).flexWrap, gap: getComputedStyle(g).gap, order: getComputedStyle(g).order, kids });
})()
