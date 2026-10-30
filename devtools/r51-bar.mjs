(() => {
    const g = (id) => document.getElementById(id);
    const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
                 vis: cs.visibility, disp: cs.display, op: cs.opacity, color: cs.color, bg: cs.backgroundColor };
    };
    const tabs = ['tabListBtn', 'tabPlayBtn', 'tabLayoutBtn', 'tabMoreBtn'].map((id) => {
        const el = g(id);
        return { id, label: el?.querySelector('.tab-label')?.textContent,
                 aria: el?.getAttribute('aria-label'), current: el?.getAttribute('aria-current'),
                 cls: el?.className, action: el?.dataset?.action, box: rect(el),
                 iconBox: rect(el?.querySelector('.tab-icon svg')) };
    });
    const bar = g('phoneActionBar');
    const panel = g('headerRight');
    const rows = ['menuFolderBtn', 'menuRefreshBtn', 'diagnosticsBtn', 'aboutBtn'].map((id) => ({
        id, text: g(id)?.querySelector('.btn-text')?.textContent,
        iconHasSvg: !!g(id)?.querySelector('.btn-icon svg'), box: rect(g(id)),
    }));
    return JSON.stringify({
        vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
        bodyCls: document.body.className,
        sidebarCollapsed: g('sidebar')?.classList.contains('collapsed'),
        panelActive: panel?.classList.contains('active'),
        barBox: rect(bar), barVis: getComputedStyle(bar).visibility, tabs, rows,
        layout: localStorage.getItem('tdashcam.layout'), theme: localStorage.getItem('tdashcam.themeMode'),
        lang: localStorage.getItem('tdashcam.language'),
    }, null, 1);
})()
