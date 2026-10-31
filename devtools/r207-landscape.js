// R207 的横屏半边：`.filter-sheet-action` 这一对（重置 / 收起）只在横屏的筛选整面里画出来
// （`html.sheet-mode` + 展开态；竖屏那一组是 `display: contents` 的另一套规则），
// 所以它的禁用态必须在横屏量 —— 竖屏里量到的是 0×0 的隐藏节点，那种「通过」是白捡的。
// 跑法：先 `adb shell settings put secure accelerometer_rotation 0; settings put system user_rotation 1`，
// 再 `bash devtools/r207-verify.sh`（它负责方向与前后对照）。
(async () => {
    const v = window.viewer, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [], notes: {} };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    out.notes.orient = innerWidth + 'x' + innerHeight;
    if (innerWidth < innerHeight) return JSON.stringify({ fatal: '没转到横屏', orient: out.notes.orient });
    document.documentElement.classList.add('touch-ui');

    const cs = (el) => getComputedStyle(el);
    const rgb = (s) => {
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[,\/\s]+/).filter(Boolean).map(Number);
        return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const lum = (c) => {
        const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    const bgOf = (el) => {
        let p = el;
        while (p && p !== document.documentElement) {
            const c = rgb(cs(p).backgroundColor);
            if (c && c[3] > 0) return [c[0], c[1], c[2]];
            p = p.parentElement;
        }
        return [255, 255, 255];
    };

    // 展开筛选整面：横屏下 `.filter-stack` 是一个从抽屉右缘折出来的面，收起时宽度 0（R171）。
    v.syncSidebarAria && v.syncSidebarAria();
    // 展开这件事走产品自己的门：`setFiltersOpen`（横屏读 `.sidebar.filters-open`，CSS 也是 landscape-only）。
    if (typeof v.setFiltersOpen === 'function') v.setFiltersOpen(true, false);
    else if (v.dom && v.dom.sidebar) v.dom.sidebar.classList.add('filters-open');
    if (v.dom && v.dom.sidebar && !v.dom.sidebar.classList.contains('filters-open'))
        v.dom.sidebar.classList.add('filters-open');
    await sleep(700);
    const btn = document.getElementById('filterResetBtn');
    const vis = (el) => !!el && el.checkVisibility({ visibilityProperty: true, displayProperty: true })
        && el.getBoundingClientRect().width > 0;
    ok('前置：横屏筛选面开着（重置钮可见可量）', vis(btn), btn ? `${Math.round(btn.getBoundingClientRect().width)}×${Math.round(btn.getBoundingClientRect().height)}` : '元素不存在');
    if (!vis(btn)) return JSON.stringify(out);
    const was = btn.disabled;
    for (const dark of [false, true]) {
        localStorage.setItem('tdashcam.themeMode', dark ? 'dark' : 'light');
        v.applyTheme(v.resolveThemeDark(dark ? 'dark' : 'light'));
        await sleep(500);
        if (document.body.classList.contains('dark-theme') !== dark) ok(`前置：主题切到${dark ? '深色' : '浅色'}`, false);
        btn.disabled = true; await sleep(150);
        const bg = bgOf(btn), c = rgb(cs(btn.color)), o = Number(cs(btn.opacity));
        const eff = [o * c[0] + (1 - o) * bg[0], o * c[1] + (1 - o) * bg[1], o * c[2] + (1 - o) * bg[2]];
        ok(`禁用态「重置」在${dark ? '深色' : '浅色'}横屏筛选面上读得清（≥3:1）`,
            ratio(eff, bg) >= 3 && ratio(c, bg) >= 3,
            `${ratio(eff, bg).toFixed(2)}:1（墨 ${cs(btn.color)}、opacity=${cs(btn.opacity)}、底 rgb(${bg})；启用态 ${ratio(c, bg).toFixed(2)}:1）`);
        btn.disabled = was;
    }
    localStorage.setItem('tdashcam.themeMode', 'light');
    v.applyTheme(v.resolveThemeDark('light'));
    const grip = document.querySelector('.pe-tile-grip');
    if (grip && vis(grip)) {
        const r = grip.getBoundingClientRect();
        ok('画格搬运柄命中区 ≥40×40', r.width >= 40 && r.height >= 40, `${Math.round(r.width)}×${Math.round(r.height)}`);
    } else out.notes.grip = '摆放编辑面这一轮没走到（不记为通过）';
    console.log(JSON.stringify(out, null, 1));
    return JSON.stringify(out);
})().catch((e) => JSON.stringify({ threw: String((e && e.message) || e) }));
