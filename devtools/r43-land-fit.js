(() => {
    let s = document.getElementById('r43-preview2');
    if (!s) { s = document.createElement('style'); s.id = 'r43-preview2'; document.head.appendChild(s); }
    s.textContent = `
    @media (orientation: landscape) and (max-height: 620px) and (max-width: 1200px) {
        .header-collapsed .header-actions-group { width: fit-content !important; }
    }`;
    const g = document.getElementById('headerActionsGroup');
    const gr = g.getBoundingClientRect();
    const icons = [...g.children].filter(c => c.tagName === 'BUTTON' && getComputedStyle(c).display !== 'none');
    const rows = ['tapBehaviorChoice', 'themeChoice'].map(id => {
        const r = document.getElementById(id).getBoundingClientRect();
        return { id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
    });
    return JSON.stringify({ panel: { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height) },
        iconLines: [...new Set(icons.map(b => Math.round(b.getBoundingClientRect().y)))].sort((a, b) => a - b),
        rows, scroll: [g.scrollHeight, g.clientHeight], vh: innerHeight, vw: innerWidth });
})()
