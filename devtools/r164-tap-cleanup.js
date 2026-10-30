(async () => {
    const sidebar = document.querySelector('.sidebar');
    const funnel = document.querySelector('.sidebar-header .filter-toggle-btn');
    sidebar.classList.remove('filters-open');
    funnel.classList.remove('is-on');
    funnel.setAttribute('aria-expanded', 'false');
    try { localStorage.setItem('tdashcam.filtersOpen', '0'); } catch (e) { /* private mode */ }
    if (!sidebar.classList.contains('collapsed')) window.viewer.toggleSidebar(false);
    await new Promise((r) => setTimeout(r, 500));
    return JSON.stringify({ drawerOpen: !sidebar.classList.contains('collapsed'), filtersOpen: sidebar.classList.contains('filters-open') });
})()
