// R99-1: which landscape ⋮ grid actually fits? The shipped build has no group headings sideways
// (that is the bug), and putting them back costs three full rows in a panel that already scrolled.
// Each candidate is injected as a trailing `!important` stylesheet so the *live* grid lays out, and
// we read back columns, scroll overflow and — the part arithmetic cannot settle — how many labels
// come out truncated. Run rotated to landscape with the panel open.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const panel = document.getElementById('headerActionsGroup');
    const SEL = '.header-collapsed .header-right .header-actions-group';

    const style = document.createElement('style');
    document.head.appendChild(style);
    // The height cap is part of the fix (the old one subtracted `--safe-bottom` on top of
    // `--action-h`, which already reaches over the inset), so every variant is measured against the
    // cap the new build will have, not the one this build has.
    const NEWCAP = `${SEL} { bottom: calc(var(--action-h) + 12px) !important;
                             max-height: calc(var(--viewport-h) - var(--action-h) - 40px - var(--safe-top)) !important; }`;
    // One row's label is longer than any cell can be: the language toggle names the language it
    // switches *to*, so it is foreign text in both locales ("Switch to English" needs 139 px, while
    // every Chinese row needs at most 119). The grid already has the right mechanism for a row that
    // needs more room — the choice rows span three cells. Give that one row two.
    const setCss = (cols, width, divH, span2) => {
        style.textContent = `${NEWCAP}
            ${SEL} { grid-template-columns: ${cols} !important;
                     width: ${width} !important; }
            ${SEL} .menu-divider { display: ${divH ? 'flex' : 'none'} !important;
                                   grid-column: 1 / -1 !important;
                                   height: ${divH || 15}px !important; }
            ${span2 ? `${SEL} .lang-toggle-btn { grid-column: span 2 !important; }` : ''}`;
    };

    const read = async () => {
        await sleep(160);
        const grid = getComputedStyle(panel);
        const cols = grid.gridTemplateColumns.split(' ').filter(Boolean);
        const texts = [...panel.querySelectorAll('.btn-text, .choice-label')];
        const cut = texts.filter(n => n.scrollWidth > n.clientWidth + 1)
            .map(n => `${(n.textContent || '').trim().slice(0, 8)}(${n.scrollWidth}>${n.clientWidth})`);
        const rows = panel.scrollHeight / Math.max(1, cols.length);
        const divs = [...panel.querySelectorAll('.menu-divider')];
        // A row that is only partly inside the plate is the ugly case, not a row that is gone: the
        // first one you cannot read, the second one you cannot tell is there.
        const pr = panel.getBoundingClientRect();
        const clipped = [...panel.children].filter(n => {
            const r = n.getBoundingClientRect();
            return r.height > 4 && (r.bottom > pr.bottom + 1 || r.top < pr.top - 1);
        }).length;
        return {
            cols: cols.length, cellW: Math.round(parseFloat(cols[0])),
            panelW: +pr.width.toFixed(1),
            client: panel.clientHeight, content: panel.scrollHeight,
            over: panel.scrollHeight - panel.clientHeight,
            rows: +rows.toFixed(1),
            dividers: divs.filter(d => getComputedStyle(d).display !== 'none').length,
            truncated: cut.length, cut: cut.slice(0, 6),
            clippedRows: clipped,
        };
    };

    const variants = {
        // A = what shipped: five columns, headings suppressed sideways.
        A_shipped: () => setCss('repeat(5, minmax(0, 1fr))', 'min(760px, calc(100vw - 12px))', 0),
        // Now the headings get their own full row, which is what the real fix does.
        F_keep5: () => setCss('repeat(5, minmax(0, 1fr))', 'min(760px, calc(100vw - 12px))', 15),
        G_6_capped: () => setCss('repeat(6, minmax(0, 1fr))', 'min(760px, calc(100vw - 12px))', 15),
        H_6_wide: () => setCss('repeat(6, minmax(0, 1fr))', 'calc(100vw - 12px)', 15),
        I_6_wide_thin_div: () => setCss('repeat(6, minmax(0, 1fr))', 'calc(100vw - 12px)', 11),
        J_7_wide: () => setCss('repeat(7, minmax(0, 1fr))', 'calc(100vw - 12px)', 15),
        K_auto138_wide: () => setCss('repeat(auto-fill, minmax(138px, 1fr))', 'calc(100vw - 12px)', 15),
        // The two candidates that give the long row a second cell.
        L_7_wide_span2: () => setCss('repeat(7, minmax(0, 1fr))', 'calc(100vw - 12px)', 15, true),
        M_auto112_span2: () => setCss('repeat(auto-fill, minmax(112px, 1fr))', 'calc(100vw - 12px)', 15, true),
    };

    const out = { viewport: `${innerWidth}x${innerHeight}`, items: {}, variants: {} };
    out.itemCount = panel.children.length;
    for (const [name, apply] of Object.entries(variants)) {
        apply();
        panel.scrollTop = 0;
        out.variants[name] = await read();
    }
    style.remove();
    return out;
})()
