// 由 r118-preextract.cjs 生成：把源码里 R118 的新 CSS 与新 DOM 原样塞进正在运行的 APP，
// 装机前先看排版与层叠（占位符已被替换成真实文本）。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const px = (x) => Math.round(parseFloat(x) * 100) / 100;
    // 占位符外面不能再带引号：替换进来的是 JSON.stringify 的结果，它自带引号。
    const CSS = "/* R118 · 抽屉「事件类型」。`<select>` 弹的是系统菜单，字色和材质都不归 app 管，是这个抽屉里\n   唯一一处和玻璃面板割裂的地方；手机改成和 ⋮ 面板同款的四段直选（`.choice-segments` /\n   `.choice-segment` / `.on` 全部复用，包括选中态的品牌紫）。\n   闸门是 `html.touch-ui`（只由安卓壳挂上，script.js 943），不是 `(hover:none)` 那条：窄窗口的\n   桌面和触屏笔记本都够得着后者，而它们该用自己一直有的下拉框 —— 与本文件 3327 / 5579 同一口径。\n   `<select>` 留在文档里当值容器：`dom.eventFilter` 的四个读者（筛选、清除筛选、hasActiveFilters、\n   i18n）一行都不用改。 */\n.filter-type-group .type-segments {\n    display: none;\n}\n\nhtml.touch-ui .filters {\n    flex-wrap: wrap;\n}\n\n/* 两列各占一行：四段要 283.3px（竖屏实测），挤进 137.6px 的半列时每段只剩 25.4 的墨位，\n   连两字都差 2.8。日期行跟着铺满，代价是抽屉多占一行。 */\nhtml.touch-ui .filters .filter-group {\n    flex: 1 1 100%;\n    min-width: 0;\n}\n\nhtml.touch-ui .filter-type-group #eventFilter {\n    display: none;\n}\n\nhtml.touch-ui .filter-type-group .type-segments {\n    display: flex;\n    width: 100%;\n}\n\n/* 段固定 40，不是 `--field-h`：横屏那一档是 38，比触摸下限还低，和 R115 导出页那段同一条\n   口径（#375 还挂着）。轨道 2+40+2 = 44，正好像竖屏抽屉里其他字段的高度。 */\nhtml.touch-ui .filter-type-group .choice-segment {\n    flex: 1 1 0;\n    min-width: 0;\n    min-height: 40px;\n}\n";
    const ROW = "<div class=\"choice-segments type-segments\" id=\"eventTypeSegments\"\r\n                         role=\"radiogroup\" aria-label=\"事件类型\">\r\n                        <button type=\"button\" class=\"choice-segment\" data-mode=\"\" role=\"radio\" aria-checked=\"false\">全部</button>\r\n                        <button type=\"button\" class=\"choice-segment\" data-mode=\"RecentClips\" role=\"radio\" aria-checked=\"false\">最近</button>\r\n                        <button type=\"button\" class=\"choice-segment\" data-mode=\"SavedClips\" role=\"radio\" aria-checked=\"false\">保存</button>\r\n                        <button type=\"button\" class=\"choice-segment\" data-mode=\"SentryClips\" role=\"radio\" aria-checked=\"false\">哨兵</button>\r\n                    </div>";
    const out = { orient: `${innerWidth}x${innerHeight}@${devicePixelRatio}` };

    const sidebar = document.querySelector('.sidebar');
    const open = () => sidebar.getBoundingClientRect().width > 1;
    if (!open()) { v && v.toggleSidebar(true); for (let i = 0; i < 40 && !open(); i++) await sleep(100); }
    if (!open()) return JSON.stringify({ err: 'DRAWER CLOSED' });
    const hadFilters = sidebar.classList.contains('filters-open');
    if (!hadFilters) sidebar.classList.add('filters-open');

    // 先清掉上一轮可能留下的实验节点（R102：崩溃的探针会把实验板留在页面里，之后每次量的都是旧节点）。
    document.getElementById('r118-precheck-style')?.remove();
    document.getElementById('eventTypeSegments')?.remove();

    const sty = document.createElement('style');
    sty.id = 'r118-precheck-style';
    sty.textContent = CSS;
    document.head.appendChild(sty);
    const group = document.querySelector('.filter-type-group');
    group.insertAdjacentHTML('beforeend', ROW);
    const track = document.getElementById('eventTypeSegments');
    await sleep(150);

    const cs = getComputedStyle(track);
    const segs = [...track.querySelectorAll('.choice-segment')];
    const ink = (el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        const w = r.getBoundingClientRect().width;
        r.detach && r.detach();
        return Math.round(w * 100) / 100;
    };
    const select = document.getElementById('eventFilter');
    const dateGroup = document.querySelector('.filter-group:not(.filter-type-group)');
    const dateField = document.getElementById('dateFilter');
    out.track = { display: cs.display, w: px(track.getBoundingClientRect().width),
        h: px(track.getBoundingClientRect().height), pad: cs.padding, gap: cs.gap,
        radius: cs.borderRadius, bg: cs.backgroundColor };
    out.segments = segs.map(s => {
        const sc = getComputedStyle(s);
        const box = s.getBoundingClientRect().width;
        return { t: s.textContent, box: Math.round(box * 10) / 10,
            room: Math.round((box - parseFloat(sc.paddingLeft) - parseFloat(sc.paddingRight)) * 10) / 10,
            ink: ink(s), h: Math.round(s.getBoundingClientRect().height * 10) / 10,
            fs: px(sc.fontSize), flex: sc.flex, radius: sc.borderRadius,
            bg: sc.backgroundColor, color: sc.color };
    });
    out.inkFits = out.segments.every(s => s.ink <= s.room);
    out.selectHidden = select ? getComputedStyle(select).display : 'ABSENT';
    out.rows = { filtersWrap: getComputedStyle(document.querySelector('.filters')).flexWrap,
        dateGroupW: px(dateGroup.getBoundingClientRect().width),
        typeGroupW: px(group.getBoundingClientRect().width),
        dateFieldH: px(dateField.getBoundingClientRect().height),
        gapBetweenRows: Math.round((group.getBoundingClientRect().top
            - dateGroup.getBoundingClientRect().bottom) * 10) / 10 };
    // 墨色对比：段上的字要能读。用 APP 自己的 contrastRatio，别手写亮度公式（R114）。
    out.contrast = (() => {
        if (typeof window.contrastRatio !== 'function') return 'NO contrastRatio';
        const s = segs[0];
        const c = getComputedStyle(s);
        const t = getComputedStyle(track);
        return { onTrack: window.contrastRatio(c.color, t.backgroundColor),
            text: c.color, track: t.backgroundColor };
    })();

    sty.remove();
    track.remove();
    if (!hadFilters) sidebar.classList.remove('filters-open');
    return JSON.stringify(out);
})()
