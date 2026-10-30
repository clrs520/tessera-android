(() => {
    const group = document.getElementById('headerActionsGroup');
    const headerRight = document.getElementById('headerRight');
    const dpr = window.devicePixelRatio;
    const r = el => {
        const b = el.getBoundingClientRect();
        return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
    };
    const cs = el => getComputedStyle(el);
    const out = {
        view: [innerWidth, innerHeight],
        headerRightClass: headerRight?.className,
        panel: r(group),
        panelCS: (() => {
            const c = cs(group);
            return { display: c.display, cols: c.gridTemplateColumns, dir: c.flexDirection, wrap: c.flexWrap, gap: c.gap, pad: c.padding };
        })(),
        children: [...group.children].map(el => {
            const c = cs(el);
            const textEl = el.querySelector('.btn-text');
            const iconEl = el.querySelector('.btn-icon');
            return {
                id: el.id || el.className,
                tag: el.tagName,
                rect: r(el),
                disp: c.display,
                fs: c.fontSize,
                w: c.width,
                h: c.height,
                pad: c.padding,
                order: c.order,
                textRect: textEl ? r(textEl) : null,
                textFs: textEl ? cs(textEl).fontSize : null,
                textDisp: textEl ? cs(textEl).display : null,
                iconRect: iconEl ? r(iconEl) : null,
            };
        }),
        dpr,
        panelScroll: [group.scrollHeight, group.clientHeight],
    };
    return JSON.stringify(out, null, 1);
})()
