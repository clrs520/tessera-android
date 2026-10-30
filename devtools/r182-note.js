// R182 · 判据：筛到「最近」时摘要处必须把「循环录像不能单条删除」说出来。
// 前置是 /sdcard/TeslaCamR182（RecentClips 下散文件，真机形状）；旧夹具那种
// 「每片一个文件夹」的 RecentClips 是*能删*的，用它测这条会白捡通过。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });

    const TIERS = ['11px', '12px', '14.08px', '16px'];
    const note = () => document.getElementById('filterNote');
    const setType = async (t) => {
        const seg = document.querySelector(`#eventTypeSegments .choice-segment[data-mode="${t}"]`);
        if (seg) seg.click(); else { v.dom.eventFilter.value = t; v.dom.eventFilter.dispatchEvent(new Event('change')); }
        await sleep(500);
    };
    const probeNote = () => {
        const n = note();
        if (!n) return null;
        const cs = getComputedStyle(n);
        return {
            hidden: n.hidden,
            display: cs.display,
            text: (n.textContent || '').trim(),
            fs: cs.fontSize,
            color: cs.color,
            sw: n.scrollWidth, cw: n.clientWidth,
            overflows: n.scrollWidth > n.clientWidth + 1,
            portrait: innerHeight >= innerWidth,
            // 左缘要比「文字实际起点」：抽屉里每一行都是容器带 14px padding、控件落在 14，
            // 只比 rect.left 会把「容器贴边」当成对齐。
            textLeft: Math.round(n.getBoundingClientRect().left + parseFloat(cs.paddingLeft || '0')),
            top: Math.round(n.getBoundingClientRect().top),
            bottom: Math.round(n.getBoundingClientRect().bottom),
            cardLeft: (() => {
                const c = document.querySelector('.video-card');
                return c ? Math.round(c.getBoundingClientRect().left) : -1;
            })(),
            cardTop: (() => {
                const c = document.querySelector('.video-card');
                return c ? Math.round(c.getBoundingClientRect().top) : -1;
            })(),
            segBottom: (() => {
                const rs = ['#eventTypeSegments', '#quickFilters', '#recentDirs']
                    .map(s => document.querySelector(s))
                    .filter(Boolean).map(m => m.getBoundingClientRect().bottom);
                return rs.length ? Math.round(Math.max(...rs)) : 0;
            })(),
            inDrawer: (() => {
                const a = n.getBoundingClientRect();
                const b = document.querySelector('.sidebar').getBoundingClientRect();
                return a.left >= b.left - 1 && a.right <= b.right + 1;
            })(),
            box: `${Math.round(n.getBoundingClientRect().width)}x${Math.round(n.getBoundingClientRect().height)}`,
            painted: n.getBoundingClientRect().height > 0 && n.getBoundingClientRect().width > 0,
        };
    };

    // ---- 前置 ----
    // `toggleSidebar(true)` 不幂等：已经开着时它等于「关」。只在读到确实关着时才调。
    const drawer = document.querySelector('.sidebar');
    if (drawer && drawer.getBoundingClientRect().left < -1) {
        v.toggleSidebar(true);
        await sleep(700);
    }
    const drawerOpen = (document.querySelector('.sidebar')?.getBoundingClientRect().left ?? -99) >= -1;
    const recent = (v.eventGroups || []).find(e => e.eventType === 'RecentClips');
    ok('前置：抽屉开着', drawerOpen);
    ok('前置：目录里有「最近」事件', !!recent, recent ? `${(recent.segments || []).length} 段` : '没有');
    ok('前置：这一条确实没有自己的文件夹（删不了才是本次要说明的事）',
        !!recent && v.eventDeleteTargets(recent) === null,
        recent ? `targets=${recent ? (v.eventDeleteTargets(recent) || []).length : '-'}` : '无事件');

    const langWas = v.currentLanguage;
    // 期望的文案不写死在探针里：拿拒绝路径真正会弹的那条 toast 当基准（`i18n` 是脚本作用域里的
    // 常量，页外取不到；而这条判据要守的正是「摘要行与 toast 用的是同一句」）。
    const askRefusal = () => {
        let said = null;
        const orig = v.showToast;
        v.showToast = (msg) => { said = msg; };
        try { v.openDeleteConfirm(recent); } catch (e) { said = 'threw ' + e.message; }
        v.showToast = orig;
        // 前置不成立时（那盘素材的「最近」其实有自己的文件夹）这条会**真的把确认框打开**，
        // 而 `z 2000` 的全屏遮罩会留在页面上 —— 下一支判据量到的就是「整屏被盖住」。
        // 取完文案必须把它交还给产品自己关掉，别把现场留给别人。
        const modal = document.getElementById('deleteConfirmModal');
        if (modal && modal.classList.contains('show')) {
            document.getElementById('deleteCancelBtn')?.click();
            modal.classList.remove('show');
            modal.style.display = 'none';
            v.pendingDelete = null;
        }
        return said;
    };
    for (const lang of ['zh', 'en']) {
        if (v.currentLanguage !== lang) { v.setLanguage(lang); await sleep(500); }
        const want = askRefusal();
        await setType('RecentClips');
        const n = probeNote();
        ok(`筛到「最近」：摘要处有一行说明（${lang}）`, !!n && n.display !== 'none' && !n.hidden && n.painted,
            n ? `display=${n.display} hidden=${n.hidden} ${n.box}` : '元素不存在');
        ok(`说明的文字就是拒绝时弹的那句，不是另写一份（${lang}）`, !!n && !!want && n.text === want,
            n ? `摘要="${(n.text || '').slice(0, 24)}" toast="${String(want).slice(0, 24)}"` : '元素不存在');
        ok(`字号在档位内、墨用次要色（${lang}）`, !!n && TIERS.includes(n.fs), n ? n.fs : '元素不存在');
        ok(`说明的文字与列表同一根左缘（${lang}）`,
            !!n && Math.abs(n.textLeft - n.cardLeft) <= 1,
            n ? `文字左=${n.textLeft} 卡片左=${n.cardLeft}` : '元素不存在');
        // 位置本身就是需求：说明属于「这批列表」，不属于筛选控件。夹在搜索框与「选择日期」中间
        // 是用户明确否掉的那一版（真机截图 2026-10-27）。
        ok(`说明贴在列表顶部：第一张卡片就在它下面（${lang}）`,
            !!n && n.cardTop > 0 && n.bottom <= n.cardTop + 1 && n.cardTop - n.bottom <= 44,
            n ? `说明底=${n.bottom} 首卡顶=${n.cardTop} 间隔=${n.cardTop - n.bottom}` : '元素不存在');
        ok(`说明不再夹在筛选控件中间（${lang}）`,
            !!n && (n.portrait ? n.top >= n.segBottom - 1 : n.inDrawer),
            n ? `说明顶=${n.top} 控件底=${n.segBottom} 在抽屉列内=${n.inDrawer}` : '元素不存在');
        ok(`说明不被横向裁切（${lang}）`, !!n && !n.overflows && n.cw > 40, n ? `sw=${n.sw} cw=${n.cw}` : '元素不存在');
        await setType('SentryClips');
        const s = probeNote();
        ok(`切到「哨兵」就不说明了（${lang}）`, !s || s.display === 'none' || s.hidden,
            s ? `display=${s.display} hidden=${s.hidden}` : '元素不存在');
        await setType('');
        const a = probeNote();
        ok(`「全部」也不说明（混着能删的事件，说了会误导）（${lang}）`, !a || a.display === 'none' || a.hidden,
            a ? `display=${a.display} hidden=${a.hidden}` : '元素不存在');
    }
    if (v.currentLanguage !== langWas) { v.setLanguage(langWas); await sleep(400); }

    // ---- 桌面不许看见它 ----
    await setType('RecentClips');
    const html = document.documentElement;
    const had = html.classList.contains('touch-ui');
    html.classList.remove('touch-ui');
    await sleep(120);
    const desk = probeNote();
    ok('摘掉 touch-ui 后这行不画（守「桌面一字不改」）', !desk || desk.display === 'none',
        desk ? `display=${desk.display}` : '元素不存在');
    if (had) html.classList.add('touch-ui');
    await sleep(120);

    // ---- 别把既有设计带歪：这两个入口仍然不给删除 ----
    await setType('RecentClips');
    const card = document.querySelector(`[data-event-id="${CSS.escape(recent.eventId)}"]`);
    ok('左滑仍然不挂删除按钮', !!card && !card.querySelector('.row-swipe-delete'),
        card ? `swipeable=${card.classList.contains('swipeable')}` : '卡片缺失');
    v.showCardContextMenu(recent);
    await sleep(260);
    const row = document.querySelector('.card-context-menu [data-context="delete"]');
    ok('长按菜单的删除行仍然藏着', !!row && row.hidden === true,
        row ? `hidden=${row.hidden} display=${getComputedStyle(row).display}` : '菜单行缺失');
    document.querySelector('.card-context-menu')?.classList.remove('show');
    await sleep(150);

    await setType('');
    v.toggleSidebar(false);
    return out;
})()
