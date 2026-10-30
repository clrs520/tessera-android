// R116b · 面板 `bottom: calc(--action-h + 12px)` 到底是不是相对视口算的。
// 间隙 = 「视口底 − 面板底」−「视口底 − 底条顶」。如果某个祖先带 transform/filter/backdrop-filter，
// fixed 的包含块就不是视口而是那个祖先，声明的 bottom 对、落点全错（R98 那一族）。
// 这里把祖先链逐条列出来，并把「期望离底」和「实测离底」并排打。
(() => {
    const px = (v) => Math.round(parseFloat(v) * 10) / 10;
    const panel = document.querySelector('.header-collapsed .header-actions-group')
        || document.querySelector('.header-actions-group');
    const bar = document.querySelector('.phone-action-bar');
    const cs = getComputedStyle(document.documentElement);
    const declared = px(cs.getPropertyValue('--action-h') || '0');
    const out = {};
    if (!panel) return JSON.stringify({ error: '面板不在（没开？）' });
    const p = panel.getBoundingClientRect();
    const pc = getComputedStyle(panel);
    out.panel = {
        top: px(p.top), bottom: px(p.bottom), h: px(p.height),
        cssPosition: pc.position, cssBottom: pc.bottom,
        expectedFromViewportBottom: declared + 12,
        actualFromViewportBottom: px(innerHeight - p.bottom),
        delta: px((innerHeight - p.bottom) - (declared + 12)),
    };
    out.bar = bar ? { top: px(bar.getBoundingClientRect().top),
        gapPanelBottomToBarTop: px(bar.getBoundingClientRect().top - p.bottom) } : 'ABSENT';
    const TRIGGER = ['transform', 'translate', 'scale', 'rotate', 'filter', 'backdrop-filter',
        'will-change', 'contain', 'perspective'];
    const chain = [];
    for (let el = panel.parentElement; el && el.nodeType === 1; el = el.parentElement) {
        const s = getComputedStyle(el);
        const hits = {};
        for (const t of TRIGGER) {
            const v = s[t];
            if (v && v !== 'none' && v !== 'auto' && v !== 'normal' && v !== '') hits[t] = v;
        }
        const r = el.getBoundingClientRect();
        chain.push({
            el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
                + (el.className && typeof el.className === 'string'
                    ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''),
            rect: { top: px(r.top), bottom: px(r.bottom) },
            cbTriggers: Object.keys(hits).length ? hits : undefined,
            lensOn: el.classList && el.classList.contains('lens-on') ? true : undefined,
        });
    }
    out.ancestors = chain;
    out.verdict = Math.abs(out.panel.delta) <= 1
        ? `包含块=视口，离底 ${out.panel.actualFromViewportBottom}（期望 ${out.panel.expectedFromViewportBottom}）`
        : `包含块不是视口！离底 ${out.panel.actualFromViewportBottom} 而声明 ${out.panel.expectedFromViewportBottom}，差 ${out.panel.delta}px`;
    return JSON.stringify(out, null, 1);
})();
