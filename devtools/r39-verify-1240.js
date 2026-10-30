(() => {
    const cs = getComputedStyle(document.documentElement);
    const tokens = {};
    ['--accent', '--accent-solid', '--bg-button', '--cta-fill', '--cta-fill-x', '--glass-tint'].forEach(t => {
        tokens[t] = cs.getPropertyValue(t).trim();
    });
    const SEL = ['#peStartBtn', '#peCancelBtn', '.tab-btn.on', '.tab-btn', '.empty-hero-btn', '.about-version',
        '.clip-selection', '.map-btn.gaode', '.dir-browser-item.active', '.modal-btn.primary'];
    const computed = [];
    SEL.forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
            if (i > 1) return;
            const s = getComputedStyle(el);
            if (s.display === 'none' || s.visibility === 'hidden') return;
            computed.push({
                sel: sel + (i ? '' : ''),
                bg: s['background-color'],
                img: s['background-image'].slice(0, 60),
                fg: s.color,
                radius: s.borderRadius
            });
        });
    });
    const OFF = {
        'rgb(0, 123, 255)': '#007bff', 'rgb(0, 122, 255)': '#007aff',
        'rgb(102, 126, 234)': '#667eea', 'rgb(118, 75, 162)': '#764ba2',
        'rgb(139, 92, 246)': '#8b5cf6', 'rgb(167, 139, 250)': '#a78bfa',
        'rgb(168, 85, 247)': '#a855f7', 'rgb(66, 133, 244)': '#4285F4',
        'rgba(0, 123, 255, 0.3)': 'rgba #007bff/.3', 'rgba(0, 122, 255, 0.3)': 'rgba #007aff/.3'
    };
    const hits = [];
    const seen = new Set();
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
            hits.push({ sel: (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 40)), prop: p, colour: OFF[v], y: Math.round(r.top) });
        }
    });
    return JSON.stringify({
        version: window.APP_VERSION || document.querySelector('.about-version')?.textContent || '?',
        prefix: typeof ANDROID_FILE_PREFIX === 'undefined' ? 'n/a' : ANDROID_FILE_PREFIX,
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        orientation: matchMedia('(orientation: landscape)').matches ? 'land' : 'port',
        tokens, computed, off_dialect_hits: hits.length, hits: hits.slice(0, 20)
    }, null, 1);
})()
