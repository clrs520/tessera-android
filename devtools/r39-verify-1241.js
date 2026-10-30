(() => {
    const cs = getComputedStyle(document.documentElement);
    const bodyDark = document.body.classList.contains('dark-theme');
    const out = {
        version: window.__APP_VERSION__ || (document.querySelector('.about-version') || {}).textContent || '?',
        theme: bodyDark ? 'dark' : 'light',
        orientation: matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait',
        glassToken: cs.getPropertyValue('--glass-bg-soft').trim()
    };

    // 1. Every surface that reads the glass token must now be opaque enough to read
    //    over the hardware-composited <video> surface.
    const GLASS = {
        '.phone-action-bar': '.phone-action-bar',
        '.card-context-menu': '.card-context-menu',
        '.header-collapsed .header-actions-group': '.header-collapsed .header-actions-group',
        '.empty-hero (player empty)': '.player-area.empty .empty-hero'
    };
    out.glass = [];
    Object.keys(GLASS).forEach(label => {
        document.querySelectorAll(GLASS[label]).forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return;
            const s = getComputedStyle(el);
            out.glass.push({ label, bg: s['background-color'], blur: s['backdrop-filter'] });
        });
    });

    // 2. Chrome scrollbars must be gone on the four touch-scrolled sheets.
    const SCROLL = ['#exportPhoneModal .modal-content', '.file-list', '.metadata-content', '.dir-browser-list', '#dirModal .modal-content'];
    out.scrollbars = [];
    SCROLL.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        const s = getComputedStyle(el);
        out.scrollbars.push({
            sel,
            scrollbarWidth: s['scrollbar-width'],
            // classic bar occupies layout width; overlay bar leaves clientWidth == scrollWidth-1px
            overflowPx: el.scrollWidth - el.clientWidth,
            clientW: el.clientWidth,
            scrollable: el.scrollHeight > el.clientHeight
        });
    });

    // 3. Regression: the R39-2 dialect sweep must still be clean.
    const OFF = {
        'rgb(0, 123, 255)': '#007bff', 'rgb(0, 122, 255)': '#007aff',
        'rgb(102, 126, 234)': '#667eea', 'rgb(118, 75, 162)': '#764ba2',
        'rgb(139, 92, 246)': '#8b5cf6', 'rgb(167, 139, 250)': '#a78bfa',
        'rgb(168, 85, 247)': '#a855f7', 'rgb(66, 133, 244)': '#4285F4',
        'rgba(0, 123, 255, 0.3)': 'rgba #007bff/.3', 'rgba(0, 122, 255, 0.3)': 'rgba #007aff/.3'
    };
    const seen = new Set();
    const hits = [];
    document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return;
        for (const p of ['background-color', 'color', 'border-top-color', 'border-left-color', 'fill']) {
            const v = s.getPropertyValue(p);
            if (!OFF[v]) continue;
            const k = el.tagName + '|' + el.className + '|' + p + '|' + v;
            if (seen.has(k)) continue;
            seen.add(k);
            hits.push({ sel: (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 40)), prop: p, value: v });
        }
    });
    out.offDialectHits = hits.length;
    out.offDialect = hits.slice(0, 12);
    return JSON.stringify(out, null, 1);
})();
