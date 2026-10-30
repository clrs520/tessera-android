(async () => {
    const v = window.viewer;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v.eventGroups.length) {
        const dir = v.lastScannedPath || localStorage.getItem('tdashcam.mediaDir') || '/sdcard/TeslaCamReg2';
        await v.loadTauriDirectory(dir);
        await wait(400);
    }
    if (v.dom.sidebar.classList.contains('collapsed')) { v.toggleSidebar(true); await wait(380); }
    v.setFiltersOpen(false, false);
    // A 505-row list can keep the main thread busy past a fixed sleep; poll the fold instead of
    // reading a mid-transition width.
    for (let i = 0; i < 25 && v.dom.filterStack.getBoundingClientRect().width > 0.5; i += 1) await wait(60);
    const f = v.dom.filterToggleBtn.getBoundingClientRect();
    const s = v.dom.filterStack.getBoundingClientRect();
    const l = v.dom.fileList.getBoundingClientRect();
    return JSON.stringify({
        dpr: window.devicePixelRatio,
        viewport: [window.innerWidth, window.innerHeight],
        funnel: { x: f.left + f.width / 2, y: f.top + f.height / 2 },
        sheetWidth: s.width,
        filtersOpen: v.dom.sidebar.classList.contains('filters-open'),
        events: v.lastListStats?.events ?? v.eventGroups.length,
        list: { left: l.left, width: l.width, top: l.top, height: l.height },
    });
})()
