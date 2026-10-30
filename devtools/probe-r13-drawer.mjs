(() => {
    const r = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const c = getComputedStyle(el);
        return {
            x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),
            pad: c.padding, gap: c.gap, bg: c.backgroundColor, br: c.borderRadius,
            fs: c.fontSize, disp: c.display,
        };
    };
    const cs = (el, ...props) => {
        if (!el) return null;
        const c = getComputedStyle(el);
        const o = {};
        props.forEach(p => o[p] = c[p]);
        return o;
    };
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('collapsed');
    const q = (s) => document.querySelector(s);
    const root = getComputedStyle(document.documentElement);
    const out = {
        vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
        sidebar: r(q('.sidebar')),
        gutter: getComputedStyle(sidebar).getPropertyValue('--gutter'),
        fieldH: getComputedStyle(sidebar).getPropertyValue('--field-h'),
        header: r(q('.sidebar-header')),
        filters: r(q('.filters')),
        filterGroups: [...document.querySelectorAll('.filter-group')].map(r),
        dateFilter: r(q('#dateFilter')),
        eventFilter: r(q('#eventFilter')),
        quickFilters: r(q('.quick-filters')),
        eventSearch: r(q('#eventSearch')),
        dateChips: r(q('#dateChips')),
        recentDirs: (() => {
            const el = q('#recentDirs');
            return { ...r(el), chips: [...el.querySelectorAll('.recent-chip')].map(c => c.textContent), on: el.querySelectorAll('.recent-chip.on').length };
        })(),
        permBanner: r(q('#permBanner')),
        ptrSpinner: r(q('#ptrSpinner')),
        fileList: r(q('#fileList')),
        cards: [...document.querySelectorAll('.video-card')].slice(0, 3).map(r),
        cardThumbs: [...document.querySelectorAll('.video-card .video-thumbnail')].slice(0, 3).map(r),
        footer: r(q('.sidebar-footer')),
        selectFolderBtn: r(q('#selectFolderBtn')),
        appVersion: r(q('#appVersion')),
        versionText: q('#appVersion')?.textContent,
        actionBar: r(q('#phoneActionBar')),
        actionBarGlass: cs(q('#phoneActionBar'), 'backdropFilter', 'borderRadius', 'backgroundColor', 'boxShadow'),
        tabBtns: [...document.querySelectorAll('.tab-btn')].map(b => ({ ...r(b), svg: !!b.querySelector('svg'), on: b.classList.contains('on') })),
        actionH: root.getPropertyValue('--action-h'),
        controlsH: root.getPropertyValue('--controls-h'),
        metaBottom: root.getPropertyValue('--meta-bottom'),
        safeTop: root.getPropertyValue('--safe-top'),
        safeBottom: root.getPropertyValue('--safe-bottom'),
        phoneOnlyBtns: ['#snapshotBtn', '#autoNextBtn', '#diagnosticsBtn'].map(s => cs(q(s), 'display')),
        theme: localStorage.getItem('tdashcam.themeMode'),
        dark: document.body.classList.contains('dark-theme'),
        glassBg: root.getPropertyValue('--glass-bg'),
        events: (window.viewer && window.viewer.eventGroups) ? window.viewer.eventGroups.length : -1,
    };
    return JSON.stringify(out);
})()
