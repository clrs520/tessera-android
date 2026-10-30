// R66: what is actually inside the landscape 行车数据 card, and how wide the box is.
(() => {
    const mm = window.viewer && window.viewer.metadataManager;
    if (!mm) return 'NO VIEWER';
    const q = s => document.querySelector(s);
    const row = n => {
        if (!n) return 'missing';
        const b = n.getBoundingClientRect();
        const c = getComputedStyle(n);
        const own = c.display !== 'none' && c.visibility !== 'hidden';
        let p = n.parentElement, clipped = false;
        while (p) {
            const pc = getComputedStyle(p);
            if (pc.display === 'none') { clipped = true; break; }
            p = p.parentElement;
        }
        return { id: n.id || n.className, painted: own && !clipped && b.width > 1,
            w: Math.round(b.width), display: c.display, cssHidden: c.display === 'none' };
    };
    const sel = ['#metaGear', '.meta-brake-container', '#metaBlinkerLeft', '.meta-speed-container',
        '#metaBlinkerRight', '.meta-right-col', '.metadata-secondary', '.metadata-items',
        '.metadata-dashboard', '.metadata-body', '.metadata-content'];
    return JSON.stringify({
        folded: mm.dom.panel.classList.contains('hud-folded'),
        panel: (() => { const b = mm.dom.panel.getBoundingClientRect();
            return { w: Math.round(b.width), h: Math.round(b.height), maxW: getComputedStyle(mm.dom.panel).maxWidth }; })(),
        parts: sel.map(s => row(q(s))),
        valuesText: ['#metaSpeed', '#metaGear', '#metaSteering', '#metaGPS', '#metaAutopilot']
            .map(s => s + '=' + (q(s) ? q(s).textContent : '-'))
    }, null, 1);
})()
