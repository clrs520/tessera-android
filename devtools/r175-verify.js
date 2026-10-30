// R175 — the three 1.2.279 reports:
//   1. landscape sheet: the numbers were half a safe-top above the action row (a second line on a
//      tall status bar), and the type track sat 2px below the search field across the divider,
//   2. portrait drawer: the search field's own bottom padding made the gap to 选择日期 20px while
//      every other control pair is 8px,
//   3. light-mode home: the empty player's ::before carried a black leg, dimming a light screen.
// Run twice — landscape then portrait — the script only checks what its orientation allows.
//   node devtools/cdp-eval.mjs --file devtools/r175-verify.js
(async () => {
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const rect = (s) => {
        const el = typeof s === 'string' ? document.querySelector(s) : s;
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), h: Math.round(r.height),
            right: Math.round(r.right), bottom: Math.round(r.bottom),
            cy: Math.round(r.y + r.height / 2), cx: Math.round(r.x + r.width / 2) };
    };
    const cs = (s) => {
        const el = typeof s === 'string' ? document.querySelector(s) : s;
        return el ? getComputedStyle(el) : null;
    };
    const landscape = window.innerWidth > window.innerHeight;
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });

    if (landscape) {
        if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
        v.setFiltersOpen(true, false);
        await wait(380);
        check('横屏手机档', window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches,
            `${innerWidth}x${innerHeight} safe-top=${cs(document.documentElement).getPropertyValue('--safe-top').trim()}`);
        const meta = rect('.filter-sheet-meta');
        const title = rect('.filter-sheet-title');
        const reset = rect('#filterResetBtn');
        check('数字与「筛选 / 重置 / 收起」在同一条基线（±2px）',
            !!meta && !!title && Math.abs(meta.cy - title.cy) <= 2 && Math.abs(meta.cy - reset.cy) <= 2,
            `meta.cy=${meta?.cy} title.cy=${title?.cy} reset.cy=${reset?.cy}`);
        check('数字仍是一行（没有被挤成两行）', !!meta && meta.h <= 20, `h=${meta?.h}`);
        // R176: the numbers own the strip between the title and the two actions (inset from both
        // sides), so the question is no longer 'is it on the card centre' but 'does it stay out of
        // both neighbours'. Overlap with 重置 is the bug this replaced.
        const titleR = rect('.filter-sheet-title');
        const resetR = rect('#filterResetBtn');
        check('数字整块落在标题与「重置」之间，不与任何按钮重叠',
            !!meta && !!titleR && !!resetR && meta.x >= titleR.right && meta.right <= resetR.x,
            `meta=${meta?.x}…${meta?.right} title.right=${titleR?.right} reset.x=${resetR?.x}`);
        const box = rect('#eventSearch');
        const seg = rect('.filter-sheet-body .type-segments .choice-segment');
        check('搜索框与类型条落在同一水平线（±1px）',
            !!box && !!seg && Math.abs(box.y - seg.y) <= 1,
            `box.y=${box?.y} seg.y=${seg?.y}`);
        check('筛选面正文上内距 4px（原来 8，让内衬按钮与搜索框同线）',
            cs('.filter-sheet-body')?.paddingTop === '4px', cs('.filter-sheet-body')?.paddingTop);
        v.setFiltersOpen(false, false);
    } else {
        if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
        v.setFiltersOpen(true, false);
        await wait(380);
        check('竖屏手机档', window.matchMedia('(orientation: portrait) and (max-width: 768px)').matches,
            `${innerWidth}x${innerHeight}`);
        const box = rect('#eventSearch');
        const date = rect('.filter-date-group');
        const type = rect('.filter-type-group');
        const chips = rect('.date-chips');
        const g1 = date.y - box.bottom;
        const g2 = type.y - date.bottom;
        const g3 = chips.y - type.bottom;
        check('搜索框 → 选择日期 = 8px（原来 20）', g1 === 8, `${g1}px`);
        check('和下面两档同一个 8px（三档一致）', g1 === g2 && g2 === g3, `${g1}/${g2}/${g3}px`);
        v.setFiltersOpen(false, false);
    }

    // ── light-mode home veil (theme-driven, so it is checked in both orientations) ─────────
    const before = { theme: v.themeChoice, dark: document.body.classList.contains('dark-theme') };
    const player = document.querySelector('.player-area');
    const wasEmpty = player.classList.contains('empty');
    // The veil only exists on the empty player; borrow the class for the measurement and hand it
    // back, or this would read `none` on any session that restored an event.
    if (!wasEmpty) player.classList.add('empty');
    const pseudo = () => getComputedStyle(player, '::before').backgroundImage || '';
    const darkStop = (bg) => /rgba\(\s*0,\s*0,\s*0,\s*0?\.[0-9]+\)/.test(bg || '');
    v.setThemeChoice('light');
    await wait(260);
    const lightAfter = pseudo();
    check('浅色：首页那层纱里不再有黑色 → 不再压暗',
        !!lightAfter && !darkStop(lightAfter) && /rgba\(255, 255, 255/.test(lightAfter),
        lightAfter ? lightAfter.slice(-120) : 'no pseudo');
    v.setThemeChoice('dark');
    await wait(260);
    const darkAfter = pseudo();
    check('深色：那一层还是原来那层（深色下压暗是对的）',
        darkStop(darkAfter), darkAfter ? darkAfter.slice(-120) : 'no pseudo');
    v.setThemeChoice(before.theme || 'auto');
    if (!wasEmpty) player.classList.remove('empty');
    await wait(200);

    const pass = checks.filter((c) => c.ok).length;
    return JSON.stringify({ pass, fail: checks.length - pass, checks }, null, 1);
})()
