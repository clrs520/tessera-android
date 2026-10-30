(async () => {
    const v = window.viewer;
    const r = (s) => { const e = document.querySelector(s); if (!e) return null;
        const b = e.getBoundingClientRect(); const c = getComputedStyle(e);
        return { y: Math.round(b.y), h: Math.round(b.height), bottom: Math.round(b.bottom),
            pad: c.padding, box: c.boxSizing, minH: c.minHeight, flex: c.flex, ov: c.overflow }; };
    const out = { vp: [innerWidth, innerHeight], portrait: innerHeight > innerWidth };
    v.toggleSidebar?.(true);
    v.setFiltersOpen(true, false);
    await new Promise((res) => setTimeout(res, 400));
    out.before = { header: r('.sidebar-header'), row: r('.event-search-row'), field: r('#eventSearch'),
        navShift: getComputedStyle(document.documentElement).getPropertyValue('--nav-shift').trim(),
        sidebarScroll: document.querySelector('.sidebar')?.scrollTop };
    const f = document.getElementById('eventSearch');
    f.focus();
    await new Promise((res) => setTimeout(res, 500));
    out.after = { header: r('.sidebar-header'), row: r('.event-search-row'), field: r('#eventSearch'),
        cls: document.querySelector('.sidebar')?.className,
        navShift: getComputedStyle(document.documentElement).getPropertyValue('--nav-shift').trim(),
        sidebarScroll: document.querySelector('.sidebar')?.scrollTop,
        kb: visualViewport ? Math.round(visualViewport.height) : null };
    f.blur();
    return JSON.stringify(out, null, 1);
})()
