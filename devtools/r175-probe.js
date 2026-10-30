(async () => {
    const v = window.viewer;
    const r = (s) => {
        const e = document.querySelector(s);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { y: Math.round(b.y), h: Math.round(b.height), x: Math.round(b.x),
            w: Math.round(b.width), cy: Math.round(b.y + b.height / 2) };
    };
    v.setFiltersOpen(true, false);
    await new Promise((res) => setTimeout(res, 350));
    const head = document.querySelector('.filter-sheet-head');
    const meta = document.querySelector('.filter-sheet-meta');
    const mcs = meta ? getComputedStyle(meta) : null;
    return JSON.stringify({
        head: r('.filter-sheet-head'),
        headH: head ? Math.round(head.getBoundingClientRect().height) : null,
        meta: r('.filter-sheet-meta'),
        metaPos: mcs ? mcs.position : null,
        metaDisplay: mcs ? mcs.display : null,
        title: r('.filter-sheet-title'),
        reset: r('#filterResetBtn'),
        search: r('#eventSearch'),
        searchRow: r('.event-search-row'),
        segments: r('.filter-sheet-body .type-segments'),
        sheetBody: r('.filter-sheet-body'),
        counter: document.getElementById('filterCount')?.textContent,
        size: document.getElementById('filterSize')?.textContent,
    }, null, 0);
})()
