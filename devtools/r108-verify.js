// R108 验收：这一轮三条改动各自要看见的事实。
//  A1 材质当场判定 —— 面板**第一帧可见**时就必须已经是透镜档，不许「先一种玻璃、半秒后换一种」；
//  A2 墨色约束与开合无关 —— 同一面在关着/开着两种状态下收集到的色集合必须相等；
//  A3 (R109) 折射开关已整体撤销 —— 页面上没有那一行、没有残留类、诊断不再引用被删掉的助手，
//     在场的每个面仍然从 `@supports` 那档拿到模糊，压在画面上的那个面拿到 url()。
// 打开一律走用户那条路（点 tabMoreBtn），量具不许替 APP 抄近路。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const SEL = '#headerActionsGroup';
    const SURF = {
        底部条: '.phone-action-bar', '⋮ 面板': '.header-collapsed .header-actions-group',
        长按菜单: '.card-context-menu', 行车数据卡片: '.metadata-panel', 找片hero: '.player-area.empty .empty-hero'
    };
    const cs = (sel, p) => { const n = document.querySelector(sel); return n ? getComputedStyle(n)[p] : null; };
    const bf = (sel) => { const n = document.querySelector(sel); if (!n) return 'missing';
        const c = getComputedStyle(n);
        return (c.backdropFilter && c.backdropFilter !== 'none' ? c.backdropFilter : c.webkitBackdropFilter) || 'none'; };
    const hdr = () => document.querySelector('.header-right');
    const v = window.viewer;
    const parseInk = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    // 和运行时同一套规则（A2 之后：只跳没字的，display/visibility 都不跳）。
    const inksOf = () => {
        const el = document.querySelector(SEL); if (!el) return [];
        const set = new Set();
        for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
            if (!n.textContent || !n.textContent.trim()) continue;
            const c = parseInk(getComputedStyle(n).color);
            if (c.length === 3) set.add(c.join(','));
        }
        return [...set].sort();
    };

    // 装机之后列表还在扫：`eventGroups` 空的时候 `find()` 返回 undefined，直接 `.eventId` 就把整份
    // 探针抛掉（本轮第一次跑就是这么红的）。先等它有事件，等不到就明确说明，别让它冒充「代码坏了」。
    for (let i = 0; i < 40 && !(v.eventGroups || []).length; i++) await sleep(500);
    const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')))
        || (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty') && ev) {
        await v.playEvent(ev.eventId);
        await sleep(3200);
    }
    out.events = (v.eventGroups || []).length;
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    await sleep(1000);
    if (hdr()?.classList.contains('active')) { document.getElementById('tabMoreBtn').click(); await sleep(800); }
    out.orient = `${innerWidth}x${innerHeight}@${devicePixelRatio}`;
    out.backdrop = `${glassState.src}/${glassState.luma}`;

    // ---- A2 约束与开合无关 -----------------------------------------------------------------------
    const closedInks = inksOf();
    document.getElementById('tabMoreBtn').click();
    for (let i = 0; i < 24 && +cs(SEL, 'opacity') !== 1; i++) await sleep(60);
    const openInks = inksOf();
    ok(`A2 墨色集合与开合无关（关着 ${closedInks.length} 种 / 开着 ${openInks.length} 种）`,
        closedInks.join('|') === openInks.join('|'),
        closedInks.join('|') === openInks.join('|') ? '两种状态同集合'
            : `只在开着出现：${openInks.filter((x) => !closedInks.includes(x)).join(',')}｜只在关着出现：${closedInks.filter((x) => !openInks.includes(x)).join(',')}`);

    // ---- A1 第一帧可见就已经是透镜档 -------------------------------------------------------------
    const rects = [...document.querySelectorAll('.video-container')]
        .filter((x) => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'))
        .map((x) => { const vid = x.querySelector('video'); if (!vid || !vid.videoWidth) return null;
            const b = x.getBoundingClientRect(); const s = Math.min(b.width / vid.videoWidth, b.height / vid.videoHeight);
            const h = vid.videoHeight * s, w = vid.videoWidth * s;
            return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
                left: b.left + (b.width - w) / 2, right: b.left + (b.width + w) / 2 }; })
        .filter(Boolean);
    let covPct = 0;
    { const el = document.querySelector(SEL); const r = el.getBoundingClientRect(); let cov = 0;
        for (const p of rects) { const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
            const w = Math.min(r.right, p.right) - Math.max(r.left, p.left); if (y > 0 && w > 0) cov += y * w; }
        covPct = 100 * Math.min(1, cov / (r.width * r.height)); }
    if (covPct < 2) {
        ok('A1 第一帧可见就已经是透镜档', false, `这一面只压画面 ${covPct.toFixed(1)}%，本来就不该折射——换视图重测`);
    } else {
        // 「先关一下再打开」不能靠奇偶：上一段已经把面板打开了，这里再盲点一下就是「关掉」，
        // 于是后面的采样全程在量一个关着的面板（本轮就是这么红的：24 帧没有一帧 opacity=1）。
        const closeUp = async () => {
            if (!hdr()?.classList.contains('active')) return true;
            document.getElementById('tabMoreBtn').click();
            for (let i = 0; i < 20 && hdr()?.classList.contains('active'); i++) await sleep(100);
            return !hdr()?.classList.contains('active');
        };
        ok('A1 采样前面板确实关着（不靠奇偶猜）', await closeUp(), `active=${!!hdr()?.classList.contains('active')}`);
        const frames = [];
        document.getElementById('tabMoreBtn').click();               // 打开，逐帧采
        for (let i = 0; i < 24; i++) {
            frames.push({ t: i * 60, op: cs(SEL, 'opacity'), lens: /url\(/.test(bf(SEL) || ''), cls: document.querySelector(SEL).classList.contains('lens-on') });
            if (+cs(SEL, 'opacity') === 1 && /url\(/.test(bf(SEL) || '')) break;
            await sleep(60);
        }
        const firstVisible = frames.find((f) => +f.op === 1);
        ok('A1 第一帧可见就已经是透镜档（不等下一拍）', !!firstVisible && firstVisible.lens,
            `重叠 ${covPct.toFixed(1)}%：第一帧 opacity=${firstVisible ? firstVisible.op : '-'} 滤镜=${firstVisible ? (firstVisible.lens ? 'url()' : '还没有 url()') : '没等到'}，共采 ${frames.length} 帧`);
    }

    // ---- A3 (R109) 折射开关撤销 -------------------------------------------------------------------
    // 撤销的验收必须是「引用得到处都不在」，不是「CSS 里搜不到那个类」：这一行如果只删了一半，
    // 剩下的 `glassRefractEnabled()` 会在有人读诊断的那一刻抛 ReferenceError（本轮就是这么撞上的）。
    ok('A3 ⋮ 面板里没有「玻璃折射」那一行',
        !document.getElementById('glassRefractBtn') && !document.getElementById('glassRefractLabel'),
        `btn=${!!document.getElementById('glassRefractBtn')}`);
    // 1.2.185 在那台机器上写过一次偏好键，这里**不要求它消失**（没东西再读它，留着无害），要求的是
    // 「它存在也换不来那个类」—— 所以把它的值一起打进上下文，看着像断言其实是在证伪。
    ok('A3 文档根没有残留类，助手函数已删干净',
        !document.documentElement.classList.contains('lens-refract')
        && typeof window.glassRefractEnabled !== 'function',
        `cls=${document.documentElement.className.slice(0, 40)} 助手=${typeof window.glassRefractEnabled} 旧键=${String(localStorage.getItem('tdashcam.glassRefract'))}`);
    // 撤掉开关不等于撤掉材质：五个面**在场的那些**必须仍然有后景滤镜，只是不再来自那条 `:not(.lens-refract)`。
    const present = Object.values(SURF).filter((s) => document.querySelector(s));
    ok(`A3 撤销后在场的 ${present.length} 个面都还有后景滤镜`,
        present.length >= 4 && present.every((s) => { const f = bf(s) || 'none'; return f !== 'none'; }),
        present.map((s) => `${s}:${(bf(s) || 'none').slice(0, 12)}`).join(' '));
    const diagAll = v.describePhoneGeometry ? v.describePhoneGeometry() : [];
    const glassLine = diagAll.find((l) => /^glass /.test(l)) || '(没有 glass 行)';
    const lensLine = diagAll.find((l) => /^lens /.test(l)) || '(没有 lens 行)';
    ok('A3 读诊断不炸（旧字段引用的助手已删干净）',
        diagAll.length >= 3 && !/refract=|pref=/.test(glassLine), `${diagAll.length} 行`);
    ok('A3 诊断带上迟滞的取证字段 thinHold', /thinHold=\d+\/\d+ms/.test(lensLine), lensLine.slice(0, 150));
    // 「lensLive==0 也算过」是一条会自己变绿的判据（R102 记过）：面板压在画面上时必须真的在折射。
    for (let i = 0; i < 20 && glassState.lensLive < 1; i++) await sleep(150);
    ok('A3 撤销后透镜档仍然上得来（不是一次性的）',
        glassState.lensLive >= 1 && /url\(/.test(bf(SEL) || ''),
        `lensLive=${glassState.lensLive} 面板=${(bf(SEL) || '').slice(0, 22)}`);
    return out;
})();
