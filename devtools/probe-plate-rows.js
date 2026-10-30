// Dump the plate's row texts and their measured widths, so the dense layout can be sized to real
// content instead of a guess.
(() => {
    const el = document.getElementById('metaDetailOverlay');
    const rows = [...el.querySelectorAll('.stats-row')];
    return JSON.stringify(rows.map(r => {
        const cells = [...r.children].map(c => ({
            t: c.textContent.trim().slice(0, 22),
            w: Math.round(c.getBoundingClientRect().width),
        }));
        return { cells, w: Math.round(r.getBoundingClientRect().width) };
    }), null, 1);
})();
