// R99-1b: what does one landscape ⋮ cell actually need to be? `minmax(112px, 1fr)` was a guess;
// this reads every row's real requirement (icon + gap + widest label + padding) and the height the
// panel is allowed, so the column count and the divider budget come from measurements instead of
// arithmetic done against one build's numbers.
(async () => {
    const panel = document.getElementById('headerActionsGroup');
    const cs = (n, p) => getComputedStyle(n).getPropertyValue(p);
    const root = getComputedStyle(document.documentElement);
    const items = [...panel.children].map(n => {
        const text = n.querySelector('.btn-text, .choice-label');
        const icon = n.querySelector('.btn-icon');
        const segs = [...n.querySelectorAll('.choice-segment')];
        const r = n.getBoundingClientRect();
        return {
            cls: (n.className || '').split(' ')[0],
            id: n.id || '',
            label: text ? (text.textContent || '').trim() : '',
            labelW: text ? text.scrollWidth : 0,
            iconW: icon ? Math.ceil(icon.getBoundingClientRect().width) : 0,
            // A segment row needs its label plus every segment, not one cell.
            segW: segs.reduce((s, x) => s + Math.max(x.scrollWidth, x.getBoundingClientRect().width), 0),
            spans: n.classList.contains('menu-choice') ? 3 : 1,
            h: Math.round(r.height),
        };
    });
    const wide = items.map(i => ({
        label: i.label.slice(0, 16),
        // 0.78rem label plus the 18px glyph, the 6px gap and 14px of padding is the row's own arithmetic.
        need: i.label ? i.labelW + i.iconW + 6 + 14 : i.segW + 14,
    })).sort((a, b) => b.need - a.need);
    return {
        viewport: `${innerWidth}x${innerHeight}`,
        vars: { actionH: root.getPropertyValue('--action-h').trim(), safeTop: root.getPropertyValue('--safe-top').trim(),
            viewportH: root.getPropertyValue('--viewport-h').trim(), safeBottom: root.getPropertyValue('--safe-bottom').trim() },
        maxHeight: cs(panel, 'maxHeight'), client: panel.clientHeight, content: panel.scrollHeight,
        count: items.length, choices: items.filter(i => i.spans > 1).length,
        dividers: items.filter(i => i.cls === 'menu-divider').length,
        buttons: items.filter(i => i.cls === 'menu-divider' || i.spans > 1).length ? null : 0,
        tallest: items.filter(i => i.h > 4).map(i => i.h).reduce((a, b) => Math.max(a, b), 0),
        widest: wide.slice(0, 6),
        lang: document.documentElement.lang || document.body.dataset.lang,
    };
})()
