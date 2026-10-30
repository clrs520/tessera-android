// R114 · 用户真机 alphaLog 说：变厚发生在 `src: css(255) → video(100)` 那一拍（.45 → .842）。
// 这一支回答的是「.842 到底是谁要的」：逐面把每一种墨单独解一遍，看哪几种把整组抬上去，
// 以及把它们改暗到多少之后需求会掉下来 —— 这条同时是 #402 的账。
(() => {
    const html = document.documentElement;
    const SURF = ['.phone-action-bar', '.card-context-menu', '.header-collapsed .header-actions-group',
        '.metadata-panel', '.player-area.empty .empty-hero'];
    const parse = (s) => { const m = (s.match(/[\d.]+/g) || []).map(Number); return m.length >= 3 ? m.slice(0, 3) : null; };
    const want = (fill, bd, inks) => solveGlassAlpha(fill, bd, inks);
    const rows = [];
    for (const sel of SURF) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const fill = parse(getComputedStyle(el).backgroundColor);
        if (!fill) continue;
        const set = new Set();
        for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
            if (!n.textContent || !n.textContent.trim()) continue;
            const c = parse(getComputedStyle(n).color);
            if (c) set.add(c.join(','));
        }
        const inks = [...set].map((s) => s.split(',').map(Number));
        if (!inks.length) continue;
        for (const bdL of [255, 100]) {
            const bd = [bdL, bdL, bdL];
            const whole = want(fill, bd, inks);
            const per = inks.map((ink) => ({
                ink: `rgb(${ink.join(',')})`,
                need: +want(fill, bd, [ink]).toFixed(3),
                atWhole: +(contrastRatio(
                    [0, 1, 2].map((k) => fill[k] * whole + bd[k] * (1 - whole)), ink)).toFixed(2),
            })).sort((a, b) => b.need - a.need);
            rows.push({ sel: sel.slice(0, 34), fill: `rgb(${fill.join(',')})`, bd: bdL, whole: +whole.toFixed(3), top: per.slice(0, 4) });
        }
    }
    return JSON.stringify({
        theme: (document.querySelector('.container') || {}).className || '(无类名)',
        glassVar: getComputedStyle(html).getPropertyValue('--lens-alpha'),
        rows,
    }, null, 1);
})()
