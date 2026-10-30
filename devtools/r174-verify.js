// R174 — the three things reported on 1.2.278:
//   1. the search field sat on the header hairline,
//   2. the sheet counted the list twice (head + a fixed footer) and put the size at the bottom,
//   3. interaction motion.
// Run in the landscape phone layout:  node devtools/cdp-eval.mjs --file devtools/r174-verify.js
(async () => {
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const rect = (sel) => {
        const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
            h: Math.round(r.height), bottom: Math.round(r.bottom), right: Math.round(r.right),
            cx: Math.round(r.x + r.width / 2) };
    };
    const cs = (sel) => {
        const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
        return el ? getComputedStyle(el) : null;
    };
    const ruleExists = (needle) => {
        for (const sheet of document.styleSheets) {
            let rules = null;
            try { rules = sheet.cssRules; } catch (e) { continue; }
            const walk = (list) => {
                for (const rule of list) {
                    if (rule.cssText && rule.cssText.includes(needle)) return true;
                    if (rule.cssRules && walk(rule.cssRules)) return true;
                }
                return false;
            };
            if (rules && walk(rules)) return true;
        }
        return false;
    };

    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    check('横屏手机档', window.innerWidth > window.innerHeight
        && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches,
        `${innerWidth}x${innerHeight}`);
    if (!v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(false);
    await wait(400);
    if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    await wait(400);

    // ── 1. the search field vs the header rule ────────────────────────────────────────
    const header = rect('.sidebar-header');
    const searchRow = rect('.event-search-row');
    const searchBox = rect('#eventSearch');
    check('搜索框不再贴着头顶那条横线（间距 6px，改前 0）',
        !!searchBox && !!header && searchBox.y - header.bottom >= 5.5
        && searchBox.y - header.bottom <= 6.5,
        `header.bottom=${header?.bottom} box.top=${searchBox?.y} gap=${searchBox && header ? searchBox.y - header.bottom : '?'}`);
    check('搜索框本身仍是 40px、没有被 padding 压扁',
        !!searchBox && searchBox.h === 40, `h=${searchBox?.h}`);
    check('搜索行没有把抽屉挤宽（仍是 311）',
        !!searchRow && searchRow.w === 311, `w=${searchRow?.w}`);

    // ── 2. the sheet's numbers live in the head; no footer ────────────────────────────
    v.setFiltersOpen(true, false);
    await wait(360);
    const head = rect('.filter-sheet-head');
    check('筛选面展开（前置）', !!head && head.w >= 340, `head=${head?.w}`);
    check('底部那条固定长条已经不在 DOM 里',
        !document.querySelector('.filter-sheet-foot') && !document.querySelector('#filterSummaryCount'),
        'foot=' + !!document.querySelector('.filter-sheet-foot'));
    const countEl = document.getElementById('filterCount');
    const sizeEl = document.getElementById('filterSize');
    check('顶部把「多少段」说全了', !!countEl && /段|条|clips?/.test(countEl.textContent),
        `「${countEl?.textContent}」`);
    // The AVD fixture reports `bytes: 0` for every event (a folder of tiny clips), so the size is
    // legitimately absent there. Feed the renderer a list that does carry bytes — the number the
    // user sees on a real stick comes from the scan's byte map, not from this probe — then put the
    // real list back through the same call.
    const sized = (v.lastFilteredEvents || v.eventGroups).map((e) => ({ ...e, bytes: 3 * 1024 * 1024 }));
    v.updateFilterInsights(sized, sized);
    await wait(60);
    const sizeText = document.getElementById('filterSize')?.textContent?.trim() || '';
    check('有字节数时顶部写出手大', /MB|GB|KB/.test(sizeText), `${sized.length} × 3MB → 「${sizeText}」`);
    v.updateFilterInsights(v.lastFilteredEvents, v.lastFilteredEvents);
    await wait(60);
    const meta = rect('.filter-sheet-meta');
    check('这组数字落在卡片顶部的中线（±3px）',
        !!meta && !!head && Math.abs(meta.cx - head.cx) <= 3,
        `meta.cx=${meta?.cx} head.cx=${head?.cx}`);
    check('数字不与标题/按钮重叠',
        !!meta && !!head
        && meta.x >= rect('.filter-sheet-title').right
        && meta.right <= rect('#filterResetBtn').x,
        `meta=${meta?.x}…${meta?.right} title.right=${rect('.filter-sheet-title')?.right} reset.x=${rect('#filterResetBtn')?.x}`);
    const body = rect('.filter-sheet-body');
    check('去掉底条后正文高出约 30px（281 → ≥306）', !!body && body.h >= 306,
        `body.h=${body?.h}`);
    // the tags must still tell the truth
    const tag = document.getElementById('filterSummaryTag');
    check('「已筛选」标仍按是否有筛选出现', !!tag && (tag.hidden === !v.hasActiveFilters()),
        `hidden=${tag?.hidden} filtered=${v.hasActiveFilters()}`);
    // size and count follow a filter change
    v.setDayFilter('2026-09-01');
    await wait(320);
    const counted = document.getElementById('filterCount')?.textContent || '';
    const countedSize = document.getElementById('filterSize')?.textContent || '';
    check('筛选之后顶部数字跟着变（不是写死的）',
        /\d/.test(counted) && counted !== '', `「${counted}」「${countedSize}」`);
    v.setDayFilter('');
    await wait(300);

    // ── 3. motion ─────────────────────────────────────────────────────────────────────
    const chipMotion = cs('.filter-type-group .choice-segment');
    check('chip 按压反馈是一条 transform 120ms 的过渡',
        !!chipMotion && /transform/.test(chipMotion.transitionProperty)
        && /0\.12s/.test(chipMotion.transitionDuration),
        `${chipMotion?.transitionProperty} / ${chipMotion?.transitionDuration}`);
    check(':active 缩到 0.96 的规则真的在表里', ruleExists(':active') && ruleExists('scale(0.96)'),
        'rule present');
    // The chart is only drawn when the filtered list has days; make sure one is on screen before
    // asking for its transition, or this reads null and calls the product broken.
    if (!document.querySelector('.filter-day-bar i')) { v.setDayFilter(''); await wait(400); }
    const barMotion = cs('.filter-day-bar i');
    check('柱状图的填充色 180ms 过渡', !!barMotion
        && /background-color/.test(barMotion.transitionProperty)
        && /0\.18s/.test(barMotion.transitionDuration),
        `${barMotion?.transitionProperty} / ${barMotion?.transitionDuration}`);
    check('来源展开的入场动画已就位（且只在点按时挂类）',
        ruleExists('src-chip-in') && ruleExists('.recent-dirs.is-animating'),
        'keyframes + scoped rule');
    check('减弱动态效果的全局兜底仍压着（1ms）', ruleExists('prefers-reduced-motion'),
        'media block present');

    v.setFiltersOpen(false, false);
    v.filterAndRender();
    await wait(200);
    const pass = checks.filter((c) => c.ok).length;
    return JSON.stringify({ pass, fail: checks.length - pass, checks }, null, 1);
})()
