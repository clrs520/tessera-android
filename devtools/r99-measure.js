// R99 measurement, no assertions: the three things the real phone complained about, in numbers.
//  1. portrait: the ⋮ panel's bottom edge vs the top of the tab bar (and whether rows are clipped)
//  2. landscape: same, plus what the 5-column grid actually did to the section groups
//  3. portrait: every child of the transport row — width, gap, and what is left over
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const open = document.getElementById('headerActionsGroup');
    const menuBtn = document.getElementById('headerMenuBtn');
    const isOpen = () => getComputedStyle(open).opacity === '1'
        && getComputedStyle(open).visibility === 'visible';
    for (let i = 0; i < 30 && !isOpen(); i++) {
        if (i % 10 === 0) menuBtn.click();
        await sleep(100);
    }
    await sleep(600);

    const r = (n) => {
        const b = n.getBoundingClientRect();
        return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), l: +b.left.toFixed(1),
            w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    };
    const bar = document.querySelector('.phone-action-bar');
    const bs = getComputedStyle(bar);
    const out = {
        viewport: [innerWidth, innerHeight],
        orientation: innerWidth > innerHeight ? 'landscape' : 'portrait',
        sidebarCollapsed: document.body.classList.contains('sidebar-collapsed'),
        panel: r(open),
        panelScroll: { client: open.clientHeight, content: open.scrollHeight },
        bar: { ...r(bar), vis: bs.visibility, op: bs.opacity, z: bs.zIndex },
        panelOverBar: +(r(open).b - r(bar).t).toFixed(1),
        gapToBar: +(r(bar).t - r(open).b).toFixed(1),
    };
    // Rows: id/class, height, and whether the row is inside the panel's own box.
    const pr = r(open);
    out.rows = [...open.querySelectorAll('button, .menu-divider, .menu-choice')].map(el => {
        const b = r(el);
        return {
            who: el.id || (el.className + (el.textContent ? ':' + el.textContent.trim().slice(0, 6) : '')),
            h: b.h, w: b.w, top: b.t,
            clipped: b.b > pr.b + 1 || b.t < pr.t - 1,
            hidden: b.h === 0,
        };
    });
    // The transport row, measured whether or not it is on screen right now.
    const lane = document.querySelector('.controls-section');
    if (lane) {
        const ls = getComputedStyle(lane);
        out.transport = {
            box: r(lane), scrollW: lane.scrollWidth, clientW: lane.clientWidth,
            gap: ls.gap, padding: ls.padding,
            children: [...lane.children].filter(n => getComputedStyle(n).display !== 'none').map(n => {
                const b = r(n);
                return { who: n.id || n.className, w: b.w, h: b.h, l: b.l,
                    right: +(b.l + b.w).toFixed(1) };
            }),
        };
        out.transport.overflow = out.transport.children.reduce(
            (m, c) => Math.max(m, c.right) - (out.transport.box.l + out.transport.box.w), -999);
    }
    // What the ⋮ panel's own grid looks like, and where the dividers went.
    const os = getComputedStyle(open);
    out.panelStyle = { display: os.display, cols: os.gridTemplateColumns, overflowY: os.overflowY,
        bottom: os.bottom, top: os.top, maxHeight: os.maxHeight, position: os.position };
    out.dividers = [...open.querySelectorAll('.menu-divider')].map(d => ({
        label: d.textContent.trim(), disp: getComputedStyle(d).display, h: r(d).h }));
    return out;
})()
