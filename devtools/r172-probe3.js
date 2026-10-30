(() => {
    const v = window.viewer;
    v.setFiltersOpen(true, false);
    const sb = v.dom.sidebar;
    const st = document.querySelector('.filter-stack');
    const r = (e) => { const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(2), w: +b.width.toFixed(2), right: +b.right.toFixed(2) }; };
    const cs = getComputedStyle(sb), cst = getComputedStyle(st);
    return JSON.stringify({
        sb: r(sb), sbPos: cs.position, sbBorderL: cs.borderLeftWidth, sbBorderR: cs.borderRightWidth,
        sbClientW: sb.clientWidth, sbOffsetLeft: sb.offsetLeft,
        st: r(st), stPos: cst.position, stLeft: cst.left, stClientW: st.clientWidth,
        parent: st.offsetParent ? (st.offsetParent.id || st.offsetParent.className) : null,
        parentRect: st.offsetParent ? r(st.offsetParent) : null,
    });
})()
