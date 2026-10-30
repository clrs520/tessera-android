(() => {
    const css = `
    @media (orientation: landscape) and (max-height: 620px) and (max-width: 1200px) {
        .header-collapsed .header-actions-group .menu-choice { flex: 0 0 100% !important; width: 100% !important; min-height: 44px !important; padding: 0 6px !important; }
        .header-collapsed .header-actions-group .choice-label { flex: 0 0 68px !important; }
        .header-collapsed .header-actions-group .choice-segments { flex: 0 0 246px !important; width: 246px !important; }
    }`;
    let s = document.getElementById('r43-preview');
    if (!s) { s = document.createElement('style'); s.id = 'r43-preview'; document.head.appendChild(s); }
    s.textContent = css;
    const out = [];
    for (const id of ['tapBehaviorChoice', 'themeChoice']) {
        const row = document.getElementById(id);
        const rr = row.getBoundingClientRect();
        const segs = [...row.querySelectorAll('.choice-segment')].map(b => {
            const r = b.getBoundingClientRect();
            return { t: b.textContent, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        });
        const lr = row.querySelector('.choice-label').getBoundingClientRect();
        out.push({ id, row: { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) }, labelX: Math.round(lr.x), segs });
    }
    const g = document.getElementById('headerActionsGroup');
    const gr = g.getBoundingClientRect();
    out.push({ panel: { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height) },
        scroll: [g.scrollHeight, g.clientHeight], vh: innerHeight });
    return JSON.stringify(out);
})()
