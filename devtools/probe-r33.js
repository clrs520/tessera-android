// Round-33 probe: the ⋮ panel as a two-column grouped grid, measured with the panel open.
// Usage: open the panel first, then
//   CDP_TIMEOUT_MS=90000 node devtools/cdp-eval.mjs --file devtools/probe-r33.js
(() => {
    const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
    };
    const visible = (el) => {
        if (!el) return false;
        const c = getComputedStyle(el);
        return c.display !== 'none' && c.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
    };

    const group = document.getElementById('headerActionsGroup');
    const right = document.getElementById('headerRight');
    if (!group) return JSON.stringify({ error: 'headerActionsGroup missing' });

    const items = [...group.children].filter(el => el.tagName === 'BUTTON' || el.tagName === 'A');
    const dividers = [...group.querySelectorAll('.menu-divider')];

    // One row = one distinct top. Two-column cells share a top; a `.menu-wide` row is its own.
    const tops = [...new Set(items.filter(visible).map(el => Math.round(el.getBoundingClientRect().top)))].sort((a, b) => a - b);
    const labels = items.map(el => {
        const text = el.querySelector('.btn-text');
        return { id: el.id || 'github', text: (text?.textContent || '').replace(/\s+/g, ' ').trim(),
                 top: Math.round(el.getBoundingClientRect().top), rect: rect(el),
                 // Truncated text is the failure mode a grid introduces, and for a `.menu-wide`
                 // row the cut-off tail is the value the row exists to show.
                 clipped: text ? text.scrollWidth > text.clientWidth + 1 : null,
                 wide: el.classList.contains('menu-wide'),
                 disabled: el.disabled === true };
    });

    const canScroll = group.scrollHeight > group.clientHeight + 1;

    return JSON.stringify({
        vp: [innerWidth, innerHeight, innerWidth > innerHeight ? 'landscape' : 'portrait'],
        panelActive: right?.classList.contains('active'),
        container: { display: getComputedStyle(group).display,
                     cols: getComputedStyle(group).gridTemplateColumns,
                     rect: rect(group),
                     scroll: [group.scrollHeight, group.clientHeight],
                     fits: !canScroll,
                     overflowY: getComputedStyle(group).overflowY },
        rowCount: tops.length,
        rowTops: tops,
        dividers: dividers.map(d => ({ text: (d.textContent || '').trim(), shown: visible(d), rect: rect(d) })),
        cellWidth: items.length ? rect(items[0])[2] : null,
        cellHeight: items.length ? rect(items[0])[3] : null,
        clippedCount: labels.filter(l => l.clipped).length,
        labels,
    }, null, 1);
})();
