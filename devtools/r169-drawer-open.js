(() => {
    const v = window.viewer;
    if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    return JSON.stringify({ open: !v.dom.sidebar.classList.contains('collapsed') });
})()
