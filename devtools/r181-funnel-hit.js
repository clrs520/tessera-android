JSON.stringify((() => {
    const v = window.viewer, b = v.dom.filterToggleBtn.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    v.__clicks = 0;
    if (!v.__wired) { v.__wired = 1; b; v.dom.filterToggleBtn.addEventListener('click', () => { v.__clicks += 1; }); }
    return { dpr: devicePixelRatio, vp: [innerWidth, innerHeight],
        funnel: { x: Math.round(cx), y: Math.round(cy), w: Math.round(b.width), h: Math.round(b.height) },
        px: [Math.round(cx * devicePixelRatio), Math.round(cy * devicePixelRatio)],
        hitIsSelf: hit === v.dom.filterToggleBtn || v.dom.filterToggleBtn.contains(hit),
        hit: hit ? (hit.id || hit.className || hit.tagName) : null,
        filtersOpen: v.dom.sidebar.classList.contains('filters-open'),
        sheetW: Math.round(v.dom.filterStack.getBoundingClientRect().width),
        drawerOpen: !v.dom.sidebar.classList.contains('collapsed'), clicks: v.__clicks };
})());
