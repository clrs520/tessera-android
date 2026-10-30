// 由 r118-preextract.cjs 生成：把源码里 R118 的新 CSS 与新 DOM 原样塞进正在运行的 APP，
// 装机前先看排版与层叠（占位符已被替换成真实文本）。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const px = (x) => Math.round(parseFloat(x) * 100) / 100;
    // 占位符外面不能再带引号：替换进来的是 JSON.stringify 的结果，它自带引号。
    const CSS = /*__CSS__*/;
    const ROW = /*__HTML__*/;
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
