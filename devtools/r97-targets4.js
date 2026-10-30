// The drawer, not the ⋮ menu: that is where the recent chips and the filter row live.
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('tabListBtn')?.click();
    await sleep(600);
    const sel = ['.recent-dirs .recent-chip', '.recent-dirs button', '.filter-toggle-btn', '.event-search',
        '#eventFilter', '#dateFilter', '.date-chip', '.clear-filters-btn', '.video-card', '.card-btn',
        '.drawer-header button', '.nav-bar button', '.folder-row', '.dir-browser button', '.chip'];
    const out = {};
    sel.forEach(s => {
        const nodes = [...document.querySelectorAll(s)].filter(n => n.getBoundingClientRect().height > 0);
        if (!nodes.length) { out[s] = '-'; return; }
        const hs = nodes.map(n => Math.round(n.getBoundingClientRect().height));
        const ws = nodes.map(n => Math.round(n.getBoundingClientRect().width));
        out[s] = `${nodes.length}× h=${Math.min(...hs)}..${Math.max(...hs)} w=${Math.min(...ws)}..${Math.max(...ws)}`
            + (Math.min(...hs) < 40 ? '   SHORT' : '') + (Math.min(...ws) < 40 ? '   NARROW' : '');
    });
    return JSON.stringify(out, null, 1);
})();
