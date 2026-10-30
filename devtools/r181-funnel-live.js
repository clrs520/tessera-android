JSON.stringify((() => {
    const v = window.viewer;
    v.setFiltersOpen(false, false);
    const f = v.dom.filterToggleBtn.getBoundingClientRect();
    v.__clicks = 0;
    if (!v.__wired) { v.__wired = 1; v.dom.filterToggleBtn.addEventListener('click', () => { v.__clicks += 1; }); }
    return { dpr: devicePixelRatio, centre: [Math.round(f.left + f.width / 2), Math.round(f.top + f.height / 2)],
        px: [Math.round((f.left + f.width / 2) * devicePixelRatio), Math.round((f.top + f.height / 2) * devicePixelRatio)],
        sheetW: Math.round(v.dom.filterStack.getBoundingClientRect().width),
        filtersOpen: v.dom.sidebar.classList.contains('filters-open') };
})());
