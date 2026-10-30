// R121 · 改前预检：把 B 那一行注入**正在跑的** 1.2.202，立刻重量 ⋮ 面板的厚度需求表。
// 注入的是这一条本身（`!important` 只为压过同权重的原规则；真改动在 styles.css 里靠顺序取胜），
// 所以量到的就是装完之后的行为。
(() => {
    const old = document.getElementById('r121-precheck');
    if (old) old.remove();
    const st = document.createElement('style');
    st.id = 'r121-precheck';
    st.textContent = 'html.touch-ui body:not(.dark-theme) '
        + '.header-collapsed .header-actions-group .menu-divider { color: #444549 !important; }';
    document.head.appendChild(st);
    const panel = document.getElementById('headerActionsGroup');
    const fill = parseInk(getComputedStyle(panel).backgroundColor);
    const onGlass = (n, host, f) => {
        for (let p = n; p && p !== host; p = p.parentElement) {
            const bg = getComputedStyle(p).backgroundColor, v = parseInk(bg);
            if (v.length !== 3) continue;
            const m = bg.match(/rgba\([^()]*,\s*([\d.]+)\s*\)/);
            const a = m ? parseFloat(m[1]) : 1;
            if (a > 0.5 && v.some((x, i) => Math.abs(x - f[i]) > 12)) return false;
        }
        return true;
    };
    const seen = new Set(), inks = [];
    const divCol = getComputedStyle(panel.querySelector('.menu-divider')).color;
    for (const n of [panel, ...panel.querySelectorAll('*')]) {
        if (!n.textContent || !n.textContent.trim() || !onGlass(n, panel, fill)) continue;
        const c = parseInk(getComputedStyle(n).color);
        if (c.length !== 3 || seen.has(c.join(','))) continue;
        seen.add(c.join(',')); inks.push(c);
    }
    const rows = [];
    for (const L of [40, 70, 98, 130, 167, 197, 230, 255]) {
        const bd = [L, L, L];
        const cons = glassInkConstraints(fill, bd, inks);
        rows.push({ luma: L, need: +solveGlassAlpha(fill, bd, inks).toFixed(3),
            unsavable: cons.unsavable.map((i) => i.join(',')) });
    }
    return { theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        dividerColor: divCol, glassInkCount: inks.length,
        inks: inks.map((i) => i.join(',')), table: rows };
})()
