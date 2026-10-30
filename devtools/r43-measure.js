(() => {
    const g = document.getElementById('headerActionsGroup');
    const gr = g.getBoundingClientRect();
    const rows = ['tapBehaviorChoice', 'themeChoice'].map(id => {
        const row = document.getElementById(id);
        const c = getComputedStyle(row.querySelector('.choice-segments'));
        const segs = [...row.querySelectorAll('.choice-segment')].map(b => {
            const r = b.getBoundingClientRect(), sc = getComputedStyle(b);
            return { t: b.textContent, x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height),
                on: b.classList.contains('on'), aria: b.getAttribute('aria-checked'),
                bg: sc.backgroundColor, color: sc.color, fw: sc.fontWeight, radius: sc.borderRadius,
                clipped: b.scrollWidth > b.clientWidth + 1 };
        });
        const track = row.querySelector('.choice-segments').getBoundingClientRect();
        const lr = row.querySelector('.choice-label').getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        return { id, row: { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) },
            label: row.querySelector('.choice-label').textContent, labelX: Math.round(lr.x),
            labelClipped: row.querySelector('.choice-label').scrollWidth > row.querySelector('.choice-label').clientWidth + 1,
            track: { x: Math.round(track.x), w: Math.round(track.width), bg: c.backgroundColor, radius: c.borderRadius }, segs };
    });
    const firstText = [...g.querySelectorAll('button')].filter(b => getComputedStyle(b).display !== 'none')
        .map(b => Math.round(b.getBoundingClientRect().x)).sort((a, b) => a - b)[0];
    return JSON.stringify({ open: g.parentElement.className, dark: document.body.classList.contains('dark-theme'),
        lang: document.documentElement.lang,
        panel: { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height) },
        scroll: [g.scrollHeight, g.clientHeight], rows, firstText });
})()
