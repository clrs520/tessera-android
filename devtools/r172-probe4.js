(() => {
    const v = window.viewer;
    if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    v.setFiltersOpen(true, false);
    const r = (sel) => { const e = document.querySelector(sel); if (!e) return null;
        const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
    return JSON.stringify({
        playerArea: r('#playerArea'), main: r('.video-container.is-main'),
        badgeOffsetParent: document.getElementById('clipLoadingBadge').offsetParent.id,
        mainContent: r('.main-content'), sheet: r('.filter-stack'),
    });
})()
