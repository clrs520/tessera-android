// Which declaration actually wins for the two under-sized controls.
(async () => {
    const pick = (sel) => {
        const n = document.querySelector(sel);
        if (!n) return 'absent';
        const cs = getComputedStyle(n);
        return { h: n.getBoundingClientRect().height, height: cs.height, minHeight: cs.minHeight,
            padding: cs.padding, lineHeight: cs.lineHeight, fontSize: cs.fontSize, box: cs.boxSizing };
    };
    const rules = [];
    for (const sheet of document.styleSheets) {
        let list; try { list = sheet.cssRules; } catch (e) { continue; }
        const walk = (rs, ctx) => [...rs].forEach(r => {
            if (r.cssRules) return walk(r.cssRules, (ctx ? ctx + ' ' : '') + (r.conditionText || r.media?.mediaText || ''));
            if (!r.selectorText) return;
            if (/phone-only-btn|choice-segment\b/.test(r.selectorText) && /height|padding/.test(r.cssText)) {
                rules.push(`${ctx ? ctx + ' | ' : ''}${r.selectorText} { ${(r.cssText.match(/[^;{}]*height[^;]*;|[^;{}]*padding[^;]*;/g) || []).join(' ')} }`);
            }
        });
        walk(list, '');
    }
    return JSON.stringify({ seg: pick('.choice-segment'), menuBtn: pick('.control-btn.phone-only-btn'),
        panel: (() => { const p = document.querySelector('.header-actions-group'); if (!p) return 'absent';
            return { scroll: p.scrollHeight, client: p.clientHeight, max: getComputedStyle(p).maxHeight }; })(),
        rules }, null, 1);
})();
