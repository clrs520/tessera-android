(() => {
    const rows = ['tapBehaviorChoice', 'themeChoice'];
    return JSON.stringify(rows.map(id => {
        const row = document.getElementById(id);
        const label = row.querySelector('.choice-label');
        return { id, label: label.textContent, labelClipped: label.scrollWidth > label.clientWidth + 1,
            segs: [...row.querySelectorAll('.choice-segment')].map(s => ({ t: s.textContent, w: Math.round(s.getBoundingClientRect().width), clipped: s.scrollWidth > s.clientWidth + 1, on: s.classList.contains('on') })) };
    }));
})()
