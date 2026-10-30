(() => {
    const ov = document.getElementById('androidDirModal');
    if (getComputedStyle(ov).display === 'none') return JSON.stringify({err: 'closed'});
    const c = ov.querySelector('.modal-content');
    const cs = getComputedStyle(ov), cc = getComputedStyle(c);
    const wide = [];
    ov.querySelectorAll('*').forEach(e => {
        const r = e.getBoundingClientRect();
        if (r.right > innerWidth + 0.5 || r.left < -0.5 || e.scrollWidth > e.clientWidth + 1) {
            wide.push({cls: (e.className || e.tagName).toString().slice(0, 40), id: e.id,
                rect: [Math.round(r.x), Math.round(r.width)], sw: e.scrollWidth, cw: e.clientWidth,
                ws: getComputedStyle(e).whiteSpace, wb: getComputedStyle(e).wordBreak, ov: getComputedStyle(e).overflowX});
        }
    });
    return JSON.stringify({
        view: innerWidth, overlay: {scroll: [ov.scrollWidth, ov.clientWidth], ovx: cs.overflowX, disp: cs.display, pad: cs.padding, align: cs.alignItems, justify: cs.justifyContent},
        content: {w: Math.round(c.getBoundingClientRect().width), x: Math.round(c.getBoundingClientRect().x), cssW: cc.width, maxW: cc.maxWidth, minW: cc.minWidth, ovx: cc.overflowX, scroll: [c.scrollWidth, c.clientWidth]},
        list: (() => { const l = document.getElementById('androidDirList'); const r = l.getBoundingClientRect(); return {w: Math.round(r.width), h: Math.round(r.height), items: l.children.length, scroll: [l.scrollHeight, l.clientHeight]}; })(),
        offenders: wide.slice(0, 12)
    }, null, 1);
})()
