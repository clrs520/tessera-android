// R104 · The glass outline must be one colour on all four sides, in both themes, on device.
// Runs inside the WebView via CDP. `viewer.applyTheme(isDark)` takes a BOOLEAN — passing "light"
// is truthy and silently keeps the dark theme, which is how the first attempt at this probe
// "measured light" while still looking at dark.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const SURF = {
        底部条: '.phone-action-bar',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        行车数据卡片: '.metadata-panel',
        找片hero: '.player-area.empty .empty-hero',
        长按菜单: '.card-context-menu',
    };
    const run = () => {
        const out = { theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light', rows: [] };
        for (const [name, sel] of Object.entries(SURF)) {
            const n = document.querySelector(sel);
            if (!n) { out.rows.push({ name, absent: true }); continue; }
            const cs = getComputedStyle(n);
            const sides = ['Top', 'Right', 'Bottom', 'Left'].map((k) => cs['border' + k + 'Color']);
            const distinct = [...new Set(sides)];
            const sh = cs.boxShadow || 'none';
            out.rows.push({
                name, distinct: distinct.length, colours: distinct,
                width: cs.borderTopWidth,
                outerShadow: /rgba?\([^)]*\)\s+-?[\d.]+px\s+[\d.]+px\s+[\d.]+px/.test(sh),
                topHighlight: /inset/.test(sh),
                alpha: getComputedStyle(document.documentElement).getPropertyValue('--lens-alpha').trim(),
            });
        }
        return out;
    };
    const results = [];
    const v = window.viewer;
    if (!v || typeof v.applyTheme !== 'function' || typeof v.resolveThemeDark !== 'function') {
        return JSON.stringify({ verdict: 'FAIL 找不到主题入口 applyTheme/resolveThemeDark' });
    }
    const setMode = (mode) => {
        // `applyTheme(isDark)` 收的是布尔。传字符串 "light" 是真值 → 一直停在深色，第一版这个探针
        // 就是这么「量了两个深色主题」还打出 PASS。走 app 自己的入口：写 themeMode，再用它自己的
        // resolveThemeDark(mode) 算出布尔。量完必须断言主题真的换了，否则等于没量。
        localStorage.setItem('tdashcam.themeMode', mode);
        v.applyTheme(v.resolveThemeDark(mode));
    };
    const seen = new Set();
    for (const mode of ['dark', 'light']) {
        setMode(mode);
        for (let i = 0; i < 20 && !seen.has(mode); i++) {
            await sleep(200);
            const isDark = document.body.classList.contains('dark-theme');
            if ((mode === 'dark') === isDark) seen.add(mode);
        }
        const r = run();
        r.requested = mode;
        r.agreed = (r.theme === mode);
        results.push(r);
    }
    setMode('auto');
    if (seen.size < 2) {
        return JSON.stringify({ verdict: `FAIL 只切到 ${[...seen].join('/')} 一个主题，另一个没量到` });
    }
    const bad = [];
    for (const r of results) {
        for (const row of r.rows) {
            if (row.absent) continue;
            if (row.distinct !== 1) bad.push(`${r.theme}/${row.name}: ${row.colours.join(' vs ')}`);
            if (!row.outerShadow || !row.topHighlight) bad.push(`${r.theme}/${row.name}: 深度感缺 outer=${row.outerShadow} top=${row.topHighlight}`);
        }
    }
    return JSON.stringify({ themes: results.map((r) => `${r.theme}(alpha=${(r.rows[0] || {}).alpha || '-'})`),
        surfaces: results[0].rows.filter((x) => !x.absent).map((x) => `${x.name} ${x.width} ${x.colours[0]}`),
        verdict: bad.length ? 'FAIL ' + bad.join(' | ') : `PASS 两个主题 × ${results.flatMap((r) => r.rows.filter((x) => !x.absent)).length} 面都是同一种边色` }, null, 1);
})()
