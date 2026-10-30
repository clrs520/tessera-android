// R72-1 header row geometry: does the year-bearing chip still fit next to the clock on a 412px
// portrait? Measures the real rendered strings and then the worst case for the other language,
// because measuring only the current locale misses the one that truncates.
(() => {
    const el = document.getElementById('headerEventName');
    const clock = document.getElementById('realTimeClock');
    const left = document.querySelector('.header-left');
    const hdr = document.querySelector('.main-header');
    if (!el) return JSON.stringify({ error: 'no #headerEventName on this page' });

    const rect = (n) => {
        if (!n) return null;
        const b = n.getBoundingClientRect();
        const cs = getComputedStyle(n);
        return {
            w: Math.round(b.width), x: Math.round(b.left), right: Math.round(b.right),
            h: Math.round(b.height), y: Math.round(b.top),
            fs: cs.fontSize, clip: n.scrollWidth > n.clientWidth + 1, sw: n.scrollWidth, cw: n.clientWidth,
            text: (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
        };
    };

    const out = {
        vw: window.innerWidth, phone: isPhoneLayout(),
        chip: rect(el), clock: rect(clock), headerLeft: rect(left), header: rect(hdr),
        gapChipToClock: clock ? Math.round(clock.getBoundingClientRect().left - el.getBoundingClientRect().right) : null,
        headerLeftOverflows: left ? left.scrollWidth > left.clientWidth + 1 : null,
    };

    // Worst-case strings, measured then restored.
    const original = el.textContent;
    const cases = {
        enChip: 'Saved Clip 2026-10-08',
        zhRecent: '🕒 最近录像 2026-10-08',
        enCollision: 'Collision Detected 2026-10-08',
    };
    out.worst = {};
    for (const [name, text] of Object.entries(cases)) {
        el.textContent = text;
        out.worst[name] = rect(el);
    }
    el.textContent = original;
    out.restored = (el.textContent || '').trim();
    return JSON.stringify(out);
})()
