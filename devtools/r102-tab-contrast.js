// The light-theme screenshot showed the active 设置 tab reading washed out. Measure it instead of
// eyeballing: label ink vs the pill it sits on, and vs the glass bar behind that pill.
(() => {
    const prgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const over = (fg, bg) => [0, 1, 2].map((k) => fg[k] * (fg[3] === undefined ? 1 : fg[3]) + bg[k] * (1 - (fg[3] === undefined ? 1 : fg[3])));
    const cr = (a, b) => { const x = lum(...a), y = lum(...b);
        return +(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05))).toFixed(2); };
    const bar = document.querySelector('.phone-action-bar');
    const barFill = prgb(getComputedStyle(bar).backgroundColor);
    const out = { theme: document.body.className, glass: document.documentElement.classList.contains('glass-lens'),
        barFill: getComputedStyle(bar).backgroundColor, tabs: [] };
    for (const t of [...bar.querySelectorAll('.tab-btn')]) {
        const lab = t.querySelector('.tab-label') || t;
        const ink = prgb(getComputedStyle(lab).color);
        const pill = prgb(getComputedStyle(t).backgroundColor);
        const onPill = pill.length === 4 && pill[3] < 1 ? over(pill, [255, 255, 255]) : pill;
        out.tabs.push({ name: (lab.textContent || '').trim().slice(0, 4), active: t.classList.contains('active'),
            pill: getComputedStyle(t).backgroundColor, ink: getComputedStyle(lab).color,
            crVsPill: cr(ink.slice(0, 3), onPill.slice(0, 3)),
            crVsBarGlass: cr(ink.slice(0, 3), over(barFill, [255, 255, 255]).slice(0, 3)) });
    }
    return JSON.stringify(out);
})()
