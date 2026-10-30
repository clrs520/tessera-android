// Read the detail-data plate geometry, its resize grip position, and how well its rows fit.
(() => {
    const el = document.getElementById('metaDetailOverlay');
    const g = el.querySelector('.stats-resize');
    const c = el.querySelector('.stats-content');
    const er = el.getBoundingClientRect();
    const gr = g.getBoundingClientRect();
    return JSON.stringify({
        cls: el.className,
        plate: { x: Math.round(er.x), y: Math.round(er.y), w: Math.round(er.width), h: Math.round(er.height) },
        grip: { x: Math.round(gr.x), y: Math.round(gr.y), w: Math.round(gr.width), h: Math.round(gr.height) },
        vw: innerWidth,
        vh: innerHeight,
        rows: c.querySelectorAll('.stat-row, .stats-row').length,
        fit: {
            font: getComputedStyle(c).fontSize,
            cols: getComputedStyle(el).getPropertyValue('--stats-cols').trim(),
            scrollH: c.scrollHeight,
            clientH: c.clientHeight,
            scrollW: c.scrollWidth,
            clientW: c.clientWidth,
            overflowY: getComputedStyle(c).overflowY,
        },
    });
})();
