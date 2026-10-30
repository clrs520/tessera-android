(() => {
    const g = document.getElementById('headerActionsGroup');
    const hr = document.getElementById('headerRight');
    const c = getComputedStyle(g);
    const b = g.getBoundingClientRect();
    const par = g.offsetParent || g.parentElement;
    return JSON.stringify({
        rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)],
        scroll: [g.scrollHeight, g.clientHeight],
        cs: { pos: c.position, top: c.top, bottom: c.bottom, left: c.left, right: c.right, height: c.height, maxH: c.maxHeight, minH: c.minHeight, ovfY: c.overflowY, disp: c.display, align: c.alignContent },
        parent: par.className,
        parentRect: (() => { const p = (hr.closest('.main-header') || hr).getBoundingClientRect(); return [Math.round(p.x), Math.round(p.y), Math.round(p.width), Math.round(p.height)]; })(),
        hrRect: (() => { const p = hr.getBoundingClientRect(); return [Math.round(p.x), Math.round(p.y), Math.round(p.width), Math.round(p.height)]; })(),
        view: [innerWidth, innerHeight],
    }, null, 1);
})()
