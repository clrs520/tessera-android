// Same sweep with the two panels that actually hold the small controls open: the drawer and the ⋮ menu.
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    v.dom.menuBtn?.click();
    await sleep(400);
    const sel = ['.choice-segment', '.control-btn.phone-only-btn', '.menu-divider', '.recent-dirs .recent-chip',
        '.filter-toggle-btn', '.event-search', '#eventFilter', '.date-chip', '.clear-filters-btn',
        '.drawer-tab', '.phone-action-bar button', '.segment-item', '.pe-chip', '.cam-chip'];
    const out = {};
    sel.forEach(s => {
        const nodes = [...document.querySelectorAll(s)].filter(n => n.getBoundingClientRect().height > 0);
        if (!nodes.length) { out[s] = 'no visible node'; return; }
        const hs = nodes.map(n => n.getBoundingClientRect().height);
        out[s] = `${nodes.length} node(s) h=${Math.min(...hs).toFixed(0)}..${Math.max(...hs).toFixed(0)}`
            + (Math.min(...hs) < 40 ? '  UNDER 40' : '');
    });
    document.getElementById('menuBtn')?.click();
    return JSON.stringify(out, null, 1);
})();
