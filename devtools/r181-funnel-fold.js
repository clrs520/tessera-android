JSON.stringify((() => {
    const v = window.viewer;
    v.setFiltersOpen(false, false);
    const b = v.dom.filterToggleBtn.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    v.__clicks = 0;
    if (!v.__wired) { v.__wired = 1; v.dom.filterToggleBtn.addEventListener('click', () => { v.__clicks += 1; }); }
    return { funnelCss: [Math.round(cx), Math.round(cy)], w: Math.round(b.width),
        px: [Math.round(cx * devicePixelRatio), Math.round(cy * devicePixelRatio)],
        hitIsSelf: hit === v.dom.filterToggleBtn || v.dom.filterToggleBtn.contains(hit),
        hit: hit ? (hit.id || hit.className || hit.tagName) : null,
        filtersOpen: v.dom.sidebar.classList.contains('filters-open') };
})());
