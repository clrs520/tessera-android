// R106 · 「顶部那条线比其他三条粗」到底还有几处 —— 全应用普查，不只看那五个玻璃面。
// 判据（computed style，不看代码）：一条边同时有 ①≥0.5px 的边框 ②一条**锐利**的 inset（blur ≤ 1.5px）
// 落在这条边上，或 ③一条 0 偏移 + spread≈1px 的 inset 环（那种是四条边一起加粗）。
// 每屏都要走到：抽屉关着的面板没有盒子，量不到就等于没验过（R98 记过的「没被走过的分支」）。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const html = document.documentElement;
    const v = window.viewer;
    const label = (el) => {
        const cls = (typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
        return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
    };
    const parse = (sh) => (sh || '').split(/,(?![^(]*\))/).map((p) => {
        const nums = (p.match(/-?[\d.]+px/g) || []).map(parseFloat);
        const col = (p.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
        const m = col.match(/[\d.]+/g) || [];
        const a = m.length > 3 ? +m[3] : (m.length === 3 ? 1 : 0);
        return { inset: /inset/.test(p), x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0,
            spread: nums[3] ?? 0, light: m.length >= 3 ? a * (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255 : 0 };
    });
    const survey = () => {
        const hits = [];
        for (const el of document.querySelectorAll('body *')) {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 24 || r.height < 16) continue;
            const sh = parse(cs.boxShadow);
            const insets = sh.filter((s) => s.inset);
            if (!insets.length) continue;
            const sharp = insets.filter((s) => s.blur <= 1.5);
            if (!sharp.length) continue;
            // 0 偏移 + 有 spread 的 inset 环 = 四条边一起加一道
            const rings = sharp.filter((s) => s.x === 0 && s.y === 0 && s.spread > 0);
            const perEdge = {};
            for (const [k, side] of Object.entries({ Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' })) {
                const bw = parseFloat(cs['border' + k + 'Width']) || 0;
                if (!(bw > 0 && cs['border' + k + 'Style'] !== 'none')) continue;
                const dir = sharp.filter((s) => (side === 'top' && s.y > 0) || (side === 'bottom' && s.y < 0)
                    || (side === 'left' && s.x > 0) || (side === 'right' && s.x < 0)).length;
                const n = 1 + dir + (rings.length ? 1 : 0);
                if (n >= 2) perEdge[k] = { lines: n, borderPx: +bw.toFixed(2),
                    borderColor: cs['border' + k + 'Color'].replace(/\s/g, ''), dirInsets: dir, rings: rings.length };
            }
            if (Object.keys(perEdge).length) hits.push({ el: label(el), size: `${Math.round(r.width)}x${Math.round(r.height)}`, perEdge });
        }
        return hits;
    };
    const screens = {};
    const snap = (name) => { screens[name] = survey(); };

    snap('首页列表');
    document.getElementById('headerMenuBtn')?.click(); await sleep(900); snap('抽屉设置');
    document.getElementById('drawerDoneBtn')?.click(); await sleep(700);

    const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || ''))) || (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
    await sleep(3200);
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    snap('播放页(面板关)');
    document.querySelector('.header-right')?.classList.add('active'); await sleep(800); snap('播放页(⋮面板开)');
    document.querySelector('.header-right')?.classList.remove('active'); await sleep(500);
    const menu = document.getElementById('cardContextMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' || getComputedStyle(menu).display === 'none' ? 'grid' : menu.style.display;
        // 真打开：长按菜单靠 JS 定位，直接给它加 show/visible 状态最稳的是调 app 自己的入口
        const row = document.querySelector('#fileList > *');
        if (row && typeof v.openCardContextMenu === 'function') {
            const b = row.getBoundingClientRect();
            v.openCardContextMenu(ev ? { eventId: ev.eventId } : null, b.left + 40, b.top + 40);
        }
        await sleep(600); snap('长按菜单');
        document.body.click(); await sleep(400);
    }
    snap('导出角标(尝试显示)');
    const pill = document.getElementById('exportPill');
    if (pill) { pill.classList.add('show'); pill.style.display = 'flex'; await sleep(400); }
    screens['__pillOnly'] = pill ? survey().filter((h) => /exportPill/.test(h.el)) : [];
    if (pill) { pill.classList.remove('show'); pill.style.display = ''; }

    const byEdge = {};
    const flat = [];
    Object.entries(screens).forEach(([scr, list]) => list.forEach((h) => {
        Object.keys(h.perEdge).forEach((k) => { byEdge[k] = (byEdge[k] || 0) + 1; });
        flat.push(`${scr} ${h.el} ${Object.entries(h.perEdge).map(([k, p]) => `${k}:${p.lines}线(border ${p.borderPx}px ${p.borderColor}${p.dirInsets ? ' + ' + p.dirInsets + '向inset' : ''}${p.rings ? ' + ' + p.rings + '环inset' : ''})`).join(' ')}`);
    }));
    return JSON.stringify({ theme: html.className.match(/dark-theme/) ? 'dark' : 'light',
        css: `${Math.round(innerWidth)}x${Math.round(innerHeight)}@${devicePixelRatio.toFixed(2)}`,
        glass: html.classList.contains('glass-lens') ? 'lens' : (html.classList.contains('solid-material') ? 'solid' : 'flat'),
        byEdge, count: flat.length, rows: flat }, null, 1);
})()
