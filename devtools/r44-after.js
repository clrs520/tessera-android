(() => {
    const p = document.querySelector('.header-collapsed .header-actions-group');
    const r = p ? p.getBoundingClientRect() : null;
    const row = document.querySelector('#themeChoice');
    const on = row ? [...row.querySelectorAll('.choice-segment')].filter(b => b.getAttribute('aria-checked') === 'true').map(b => b.textContent.trim()) : null;
    return JSON.stringify({
        themeAttr: document.documentElement.getAttribute('data-theme'),
        stored: localStorage.getItem('tdashcam.themeMode'),
        sheetStillOpen: r ? [Math.round(r.width), Math.round(r.height)] : null,
        activeSegment: on,
        bg: row ? getComputedStyle(row.querySelector('.choice-segment.on') || row.querySelector('.choice-segment')).backgroundColor : null,
        focus: document.activeElement ? document.activeElement.textContent.trim().slice(0,12) : null
    });
})()
