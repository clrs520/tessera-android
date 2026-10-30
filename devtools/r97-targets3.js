// Fresh sweep with the drawer open — the small controls live there, not on the play page.
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    v.dom.menuBtn?.click();
    await sleep(500);
    const sel = ['.recent-dirs .recent-chip', '.filter-toggle-btn', '.choice-segment', '.event-search',
        '#eventFilter', '#dateFilter', '.date-chip', '.clear-filters-btn', '.control-btn.phone-only-btn',
        '.drawer-search-btn', '.nav-action-btn', '.swipe-delete-btn', '.video-card-btn', '.dir-row',
        '.dir-crumb', '.perm-btn', '.about-row'];
    const out = {};
    sel.forEach(s => {
        const nodes = [...document.querySelectorAll(s)].filter(n => n.getBoundingClientRect().height > 0);
        if (!nodes.length) { out[s] = 'no visible node'; return; }
        const hs = nodes.map(n => Math.round(n.getBoundingClientRect().height));
        const ws = nodes.map(n => Math.round(n.getBoundingClientRect().width));
        out[s] = `${nodes.length}× h=${Math.min(...hs)}..${Math.max(...hs)} w=${Math.min(...ws)}..${Math.max(...ws)}`
            + (Math.min(...hs) < 40 || Math.min(...ws) < 40 ? '   SMALL' : '');
    });
    return JSON.stringify({ open: !!document.querySelector('.drawer.open, #drawer.open'), out }, null, 1);
})();
