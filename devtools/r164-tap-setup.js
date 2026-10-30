(async () => {
    const v = window.viewer;
    for (let i = 0; i < 30 && innerWidth <= innerHeight; i += 1) await new Promise((r) => setTimeout(r, 400));
    const sidebar = document.querySelector('.sidebar');
    const funnel = document.querySelector('.sidebar-header .filter-toggle-btn');
    if (!v || !funnel) throw new Error('viewer or funnel missing');
    if (sidebar.classList.contains('collapsed')) {
        v.toggleSidebar(true);
        for (let i = 0; i < 40; i += 1) {
            if (Math.abs(sidebar.getBoundingClientRect().left) <= 0.5) break;
            await new Promise((r) => setTimeout(r, 100));
        }
    }
    sidebar.classList.remove('filters-open');
    funnel.classList.remove('is-on');
    funnel.setAttribute('aria-expanded', 'false');
    await new Promise((r) => setTimeout(r, 200));
    funnel.click();
    await new Promise((r) => setTimeout(r, 500));
    let chips = [];
    for (let i = 0; i < 20; i += 1) {
        chips = Array.from(document.querySelectorAll('#dateChips .date-chip'));
        if (chips.length > 1) break;
        await new Promise((r) => setTimeout(r, 150));
    }
    if (chips.length < 2) throw new Error('date chips not found: ' + chips.length);
    const center = (el) => { const r = el.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }; };
    const all = chips[0];
    const target = chips[1];
    return JSON.stringify({
        dpr: devicePixelRatio,
        viewport: [innerWidth, innerHeight],
        funnel: center(funnel),
        target: center(target),
        targetDate: target.dataset.date,
        targetLabel: target.textContent.trim(),
        all: center(all),
        filtersOpen: sidebar.classList.contains('filters-open'),
        display: getComputedStyle(document.querySelector('.filter-stack')).display,
    });
})()
