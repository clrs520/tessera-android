({
    dpr: window.devicePixelRatio,
    viewport: [Math.round(window.innerWidth), Math.round(window.innerHeight)],
    events: (window.viewer?.eventGroups || []).length,
    shown: (window.viewer?.lastFilteredEvents || []).length,
    // There is no `id="sidebar"` — the drawer is `div.sidebar`. `getElementById` returned null, so
    // `drawerOpen` was `!undefined` = true on every run (a free pass, including for the 基准 line)
    // and `filtersOpen` was false no matter what the funnel did.
    drawerOpen: !document.querySelector('.sidebar')?.classList.contains('collapsed'),
    filtersOpen: !!document.querySelector('.sidebar')?.classList.contains('filters-open'),
    dateValue: document.getElementById('dateFilter')?.value || '',
    stars: (window.viewer?.starredIds && window.viewer.starredIds.size) || 0,
    state: {
        starredOnly: !!window.viewer?.starredOnly,
        triggerOnly: !!window.viewer?.triggerOnly,
        sortOrder: window.viewer?.sortOrder || '',
        sourceExpanded: !!window.viewer?.sourceExpanded,
        listTop: window.viewer?.videoListComponent?.listTop ?? null,
        windowed: !!window.viewer?.videoListComponent?.listWindowed?.(),
    },
    rect: (sel) => {
        const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
    },
    chips: ['#sheetStarBtn', '#sheetTriggerBtn', '#sheetSortBtn'].map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true };
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { sel, x: r.x, y: r.y, w: r.width, h: r.height, text: el.textContent,
                 pressed: el.getAttribute('aria-pressed'), on: el.classList.contains('on'),
                 bg: cs.backgroundColor, color: cs.color };
    }),
    bars: [...document.querySelectorAll('#filterDayChart .filter-day-bar')].map((el) => {
        const r = el.getBoundingClientRect();
        return { date: el.dataset.date, x: r.x, y: r.y, w: r.width, h: r.height,
                 on: el.classList.contains('is-on'), pressed: el.getAttribute('aria-pressed') };
    }),
    chartHidden: document.getElementById('filterDayChart')?.getAttribute('aria-hidden'),
    menu: ['#starFilterBtn', '#triggerFilterBtn', '#sortOrderBtn'].map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true };
        return { sel, on: el.classList.contains('is-on'), pressed: el.getAttribute('aria-pressed'),
                 text: el.querySelector('.btn-text')?.textContent || '' };
    }),
    source: (() => {
        const wrap = document.getElementById('recentDirs');
        const more = document.getElementById('sourceMoreBtn');
        if (!wrap) return null;
        const mr = more?.getBoundingClientRect();
        return { total: wrap.querySelectorAll('.recent-chip').length,
                 visible: [...wrap.querySelectorAll('.recent-chip')]
                     .filter(c => c.getBoundingClientRect().height > 0).length,
                 folded: wrap.classList.contains('is-folded'),
                 more: mr ? { x: mr.x, y: mr.y, w: mr.width, h: mr.height,
                     text: more.textContent, hidden: more.hidden, aria: more.getAttribute('aria-expanded') } : null };
    })(),
    sheet: (() => {
        const b = document.querySelector('.filter-sheet-body');
        if (!b) return null;
        return { w: Math.round(b.getBoundingClientRect().width), clientH: b.clientHeight,
                 scrollH: b.scrollHeight, overflow: b.scrollHeight - b.clientHeight };
    })(),
    rows: document.querySelectorAll('#fileList .video-card').length,
    list: (() => {
        const c = document.getElementById('fileList');
        if (!c) return null;
        return { clientH: c.clientHeight, rows: c.querySelectorAll('.video-card').length,
                 scrollTop: Math.round(c.scrollTop), hasSpacer: !!c.querySelector('.list-spacer') };
    })(),
});
