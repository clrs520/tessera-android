// Which selectors carry which radius, so a snap is a per-control decision and not a blind sed.
(async () => {
    const byValue = {};
    const add = (v, sel) => { (byValue[v] = byValue[v] || new Set()).add(sel); };
    for (const sheet of document.styleSheets) {
        let list; try { list = sheet.cssRules; } catch (e) { continue; }
        const walk = (rs) => [...rs].forEach(r => {
            if (r.cssRules) return walk(r.cssRules);
            if (!r.selectorText || !r.style) return;
            const v = r.style.getPropertyValue('border-radius');
            if (!v) return;
            const px = v.match(/^(\d+(?:\.\d+)?)px$/);
            if (px) add(px[1], r.selectorText.slice(0, 62));
        });
        walk(list);
    }
    const out = {};
    Object.keys(byValue).sort((a, b) => b - a).forEach(k => { out[k + 'px'] = [...byValue[k]]; });
    return JSON.stringify(out, null, 1);
})();
