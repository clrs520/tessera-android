// R182 · 量抽屉里每一行的左缘，说明要跟着同一根线。
(async () => {
    const sels = ['#filterNote', '.event-search-row', '#dateFilter', '#eventTypeSegments',
        '#quickFilters', '.recent-dirs', '.video-card', '.filter-sheet-head', '.sidebar-header'];
    const out = {};
    for (const s of sels) {
        const n = document.querySelector(s);
        if (!n) { out[s] = null; continue; }
        const r = n.getBoundingClientRect();
        const cs = getComputedStyle(n);
        out[s] = `${Math.round(r.left)} w=${Math.round(r.width)} pad=${cs.paddingLeft}/${cs.marginLeft}`;
    }
    const sb = document.querySelector('.sidebar');
    const sc = sb ? getComputedStyle(sb) : null;
    return JSON.stringify({
        orient: `${innerWidth}x${innerHeight}`,
        sidebarPad: sc ? `${sc.paddingLeft}/${sc.paddingRight}` : null,
        sidebarWidth: sb ? Math.round(sb.getBoundingClientRect().width) : null,
        rows: out,
    });
})()
