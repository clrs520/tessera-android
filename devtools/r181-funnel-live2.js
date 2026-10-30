JSON.stringify((() => {
    const v = window.viewer;
    return { clicks: v.__clicks, filtersOpen: v.dom.sidebar.classList.contains('filters-open'),
        sheetW: Math.round(v.dom.filterStack.getBoundingClientRect().width) };
})());
