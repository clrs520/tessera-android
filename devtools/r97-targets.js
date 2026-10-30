// Batch-2 baseline: every phone tappable control under 40 px, measured as rendered, not as written.
(async () => {
    const sel = ['.recent-dirs .recent-chip', '.filter-toggle-btn', '.choice-segment', '.event-search',
        '#eventFilter', '.date-chip', '.clear-filters-btn', '.control-btn', '.phone-action-btn',
        '.segmented-btn', '.menu-close-btn', '.star-btn', '.delete-btn'];
    const out = {};
    sel.forEach(s => {
        const nodes = [...document.querySelectorAll(s)];
        if (!nodes.length) { out[s] = 'absent'; return; }
        const vis = nodes.map(n => n.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
        if (!vis.length) { out[s] = 'all hidden'; return; }
        const h = Math.min(...vis.map(r => r.height)), H = Math.max(...vis.map(r => r.height));
        out[s] = `${vis.length} node(s) h=${h.toFixed(0)}..${H.toFixed(0)}px` + (h < 40 ? '  UNDER 40' : '');
    });
    return JSON.stringify(out, null, 1);
})();
