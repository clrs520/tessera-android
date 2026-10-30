(() => {
    const css = `
    @media (orientation: landscape) and (max-height: 620px) and (max-width: 1200px) {
        .header-collapsed .header-actions-group .menu-choice { order: 10 !important; flex: 0 0 100% !important; width: 100% !important; min-height: 44px !important; padding: 0 6px !important; }
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
        out.push({ id, y: Math.round(rr.y), x: Math.round(rr.x), w: Math.round(rr.width),
            labelX: Math.round(row.querySelector('.choice-label').getBoundingClientRect().x),
            segs: [...row.querySelectorAll('.choice-segment')].map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent, x: Math.round(r.x), w: Math.round(r.width) }; }) });
    }
    const g = document.getElementById('headerActionsGroup');
    const gr = g.getBoundingClientRect();
    const icons = [...g.children].filter(c => c.tagName === 'BUTTON' && getComputedStyle(c).display !== 'none' && !c.className.includes('menu-choice'));
    out.push({ panel: { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height) },
        iconLines: [...new Set(icons.map(b => Math.round(b.getBoundingClientRect().y)))].sort((a, b) => a - b),
        scroll: [g.scrollHeight, g.clientHeight], vh: innerHeight, rightEdgeOk: gr.right <= innerWidth });
    return JSON.stringify(out);
})()
