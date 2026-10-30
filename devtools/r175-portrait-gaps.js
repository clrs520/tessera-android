(async () => {
    const v = window.viewer;
    const r = (s) => {
        const e = document.querySelector(s);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
    };
    if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    v.setFiltersOpen(true, false);
    await new Promise((res) => setTimeout(res, 400));
    const gaps = {};
    const s = r('.event-search-row');
    const d = r('.filter-date-group');
    const t = r('.filter-type-group');
    const c = r('.date-chips');
    const src = r('.filter-source-block');
    gaps.searchToDate = d && s ? d.top - s.bottom : null;
    gaps.dateToType = t && d ? t.top - d.bottom : null;
    gaps.typeToChips = c && t ? c.top - t.bottom : null;
    gaps.chipsToSource = src && c ? src.top - c.bottom : null;
    return JSON.stringify({ vp: [innerWidth, innerHeight], rows: { search: s, date: d, type: t, chips: c, source: src },
        gaps, filtersDisplay: getComputedStyle(document.querySelector('.filters')).display,
        dateGroupDisplay: getComputedStyle(document.querySelector('.filter-date-group')).display }, null, 0);
})()
