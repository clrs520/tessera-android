// R102 acceptance · 液态玻璃（C 档）。四件事必须同时成立，缺一条就是没做完：
//  ① 材质真的挂上了五个悬浮表面，而且是「折射 + 模糊」而不是只有模糊；
//  ② 系统「减弱透明度 / 高对比度」一开，这一整档必须退场（不是变淡，是没有）；
//  ③ 文字仍然读得出来 —— 玻璃变透之后，对比度是从「有保证」变成「取决于画面有多亮」的，
//     所以判据不能拿纯色底算，要从正在播的那一帧里取最亮的区域来算；
//  ④ 前几轮的几何成果（卡片不压画面、三种行同左缘、tab 说画面）一条都不许退。
//
// 基准自证沿用 R101 那四条：真事件、画面横向、卡片有数据、控件行可见 —— 少了这四条，
// 下面所有「没遮挡 / 对比度够」的结论都是空话。
(async () => {
    let v = window.viewer;
    // R124 · 装机后第一次跑：APP 可能起在「一个事件都没打开」的状态（events 有、current=null），
    // 而下面每条基准都靠当前事件。这里先用**用户的路**点开第一张卡片，别让整套判据死在 eventId 上。
    // R127 · 就绪门写成**一条可观测条件**：有当前事件 + 在播 + 至少一路交过纹理。
    // 前三次绊的都是各自 sleep，这次统一等它，等不到就明确记成 playErr，不再让 ev 变 undefined。
    for (let i = 0; i < 25 && !window.viewer; i += 1) await new Promise((r) => setTimeout(r, 400));
    if (!window.viewer) throw new Error('window.viewer 25 次轮询后仍不存在');
    v = window.viewer;
    if (!v.currentEvent && (v.eventGroups || []).length && typeof v.playEvent === 'function') {
        try { v.playEvent(v.eventGroups[0]); } catch (e) { out.openErr = String(e && e.message); }
    }
    for (let i = 0; i < 24 && !v.currentEvent; i += 1) await new Promise((r) => setTimeout(r, 400));

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const html = document.documentElement;
    const SURFACES = {
        底部条: '.phone-action-bar',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        长按菜单: '.card-context-menu',
        行车数据卡片: '.metadata-panel',
        找片hero: '.player-area.empty .empty-hero',
    };
    const bf = (sel) => {
        const n = document.querySelector(sel);
        if (!n) return null;
        const cs = getComputedStyle(n);
        return (cs.backdropFilter && cs.backdropFilter !== 'none' ? cs.backdropFilter : cs.webkitBackdropFilter) || 'none';
    };
    const root = getComputedStyle(html);
    const cardEl = () => document.getElementById('metadataPanel') || document.querySelector('.metadata-panel');
    const card = () => cardEl().getBoundingClientRect();
    const setView = n => document.querySelector(`.view-btn[data-view="${n}"]`)?.click();
    const painted = (video, cell) => {
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const h = video.videoHeight * s, w = video.videoWidth * s;
        return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
            left: b.left + (b.width - w) / 2, right: b.left + (b.width + w) / 2, h, w };
    };
    const covered = () => {
        if (!cardEl().classList.contains('has-data')) return null;
        const c = card();
        return [...document.querySelectorAll('.video-container')]
            .filter(x => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'))
            .map(x => { const p = painted(x.querySelector('video'), x); if (!p) return null;
                const y = Math.min(c.bottom, p.bottom) - Math.max(c.top, p.top);
                const w = Math.min(c.right, p.right) - Math.max(c.left, p.left);
                return y > 0.5 && w > 0.5 ? `${x.dataset.camera}压${y.toFixed(1)}` : null; })
            .filter(Boolean);
    };
    // 运行时 `markLensSurfaces()` 用的就是这个集合（letterbox 校正后的画面矩形），判据必须走同一条
    // 几何路径，否则「量到的重叠」和「开关依据的重叠」是两套数，两边各自都绿。
    const paintedRects = () => [...document.querySelectorAll('.video-container')]
        .filter(x => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'))
        .map(x => painted(x.querySelector('video'), x)).filter(Boolean);
    const relLum = (r, g, b) => {
        const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => { const x = relLum(...a), y = relLum(...b);
        return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
    const parseRgb = s => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number);

    // ---- 0. 基准自证 ---------------------------------------------------------------------------
    const ev = (v.eventGroups || []).find(e => !/RecentClips/i.test(String(e.eventId || '')))
        || (v.eventGroups || [])[0];
    // 装载本身会失败：这台机器负载高的时候 APP 自己的文件请求会 `AbortError: The operation was
    // aborted due to timeout`，异常从 `playEvent` 里冒出来会把**整份套件**带走（R108 实测：一条红都没有，
    // 只是没有输出）。量具不该被被测对象的一次瞬时失败打死 —— 重试，再不行就明确报「没装起来」。
    let loaded = false;
    for (let i = 0; i < 3 && !loaded; i++) {
        try {
            if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
            loaded = !!v.currentEvent;
        } catch (e) { await sleep(2500); }
    }
    out.load = loaded ? '已装载' : `装载失败（${ev ? String(ev.eventId).slice(-18) : '无事件'}）`;
    await sleep(3000);
    // R125 · 点开事件 ≠ 起播：装机后第一次跑，事件打开了但播放器还没跑，三条基准会量到空画面。
    // 这里用 app 自己的 playEvent 把播放带起来，再等它真的在播（有时间上限，不假装成功）。
    if (!v.multiCameraPlayer.isPlaying && v.currentEvent && typeof v.playEvent === 'function') {
        try { v.playEvent(v.currentEvent); } catch (e) { out.playErr = String(e && e.message); }
    }
    for (let i = 0; i < 20 && !v.multiCameraPlayer.isPlaying; i += 1) await new Promise((r) => setTimeout(r, 400));
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    setView('front'); await sleep(900);
    const one = painted(document.querySelector('#front-container video'),
        document.querySelector('#front-container'));
    ok('基准：打开的是真实多路事件', !/RecentClips/i.test(String(ev.eventId || '')), String(ev.eventId || '').slice(-22));
    ok('基准：单路画面是横向的', !!one && one.w / one.h >= 1.2, one ? `${one.w.toFixed(0)}x${one.h.toFixed(0)}` : 'null');
    ok('基准：卡片有数据', cardEl().classList.contains('has-data'));
    // 材质那一族判据全部建立在「有画面 rect」上：这一条不成立时后面几条是「量不到」而不是「不合格」，
    // 所以把它单独写成一条红，别让它冒充实现缺陷（R108 那 5 条红就是这么来的）。
    ok('基准：至少一路已经交出纹理，能算出画面矩形', paintedRects().length >= 1,
        `${paintedRects().length} 路｜playing=${v.multiCameraPlayer.isPlaying} src=${glassState.src} luma=${glassState.luma}`);

    // ---- 1. 材质挂上了，而且是透镜不是毛玻璃 ----------------------------------------------------
    // R105 起材质跟着内容走：`.lens-on` 由实测重叠逐拍开关。所以这条不再要求「五个面都有滤镜」，
    // 改成「有 `.lens-on` 的面必须有折射+模糊，没有的面必须没有」—— 判据和实现的口径必须一起改，
    // 否则这里会拿上一轮的期望当本轮的失败。
    ok('能力判据给了 glass-lens 档', html.classList.contains('glass-lens'),
        `supports=${window.CSS?.supports?.('backdrop-filter', 'url(#tesseraLens) blur(6px)')}`);
    ok('折射滤镜在 DOM 里（CSS 引用的是 id，节点必须在）', !!document.getElementById('tesseraLens'));
    // R105 的开关只给**看得见**的面挂滤镜（收起态的 ⋮ 面板盒子还在、也压在画面上，但用户没在看它，
    // 不该每拍付那 8.2ms）。所以量之前必须先确定这个面此刻是开着的，否则「重叠 47% 却没滤镜」是判据
    // 在描述量具，不是实现坏了。开合用 classList 直接置位（前一个套件可能留下打开态，先关再开）。
    const shown = (sel) => { const n = document.querySelector(sel); if (!n) return false;
        const s = getComputedStyle(n); const r = n.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0 && r.width >= 8 && r.height >= 8; };
    const hdr = () => document.querySelector('.header-right');
    hdr()?.classList.remove('active'); await sleep(400);
    hdr()?.classList.add('active');
    // 别用固定 sleep：实测这台 AVD 上「面板可见 → 下一拍被标上 lens-on」最慢要 ~600ms（几何节拍是
    // 250ms，但高负载下定时器会被推后；R99 记过 sleep 400ms 不够这一类）。轮询到它真的挂上为止。
    for (let i = 0; i < 20 && !(typeof glassState === 'object' && glassState.lensLive >= 1); i += 1) {
        await sleep(200);
    }
    await sleep(250);
    let lensMarked = 0, markBad = [];
    // 分清两种滤镜：`url(#tesseraLens)` 是这轮按内容开关的**透镜**；`blur(22px)` 那层是 R39-3/R59 为
    // 「浮层上的字要读得清」挣来的**普通模糊**，它不在本轮的开关范围里（列表页底部条背后是真有内容的）。
    // 上一版这里写 `f !== 'none'` 就等于把「还有模糊」误报成「还挂着透镜」。
    const hasLens = (sel) => /url\(/.test(bf(sel) || '');
    Object.entries(SURFACES).forEach(([name, sel]) => {
        if (!document.querySelector(sel)) return;
        const visible = shown(sel);
        const f = bf(sel) || 'none';
        const on = document.querySelector(sel).classList.contains('lens-on');
        const lens = hasLens(sel);
        if (on) lensMarked++;
        if (on && !(lens && /blur\(/.test(f))) markBad.push(`${name}: 标了 lens-on 但滤镜是 ${String(f).slice(0, 30)}`);
        if (!on && lens) markBad.push(`${name}: 没标 lens-on 却有透镜`);
        if (!visible && on) markBad.push(`${name}: 看不见却挂着 lens-on`);
    });
    ok('标了 lens-on 的面折射 + 模糊都在，没标的没有透镜，看不见的不许挂', markBad.length === 0, markBad.join(' | '));
    // 至少要有一个面真的开着，否则上面两条是「全灰即全绿」的空判据（R101 抓过的口径问题）。
    ok('⋮ 面板此刻确实是开着的（否则下面的 ≥1 判据量的是收起态）',
        shown('.header-collapsed .header-actions-group'),
        getComputedStyle(document.querySelector('.header-collapsed .header-actions-group') || document.body).opacity);
    // 红了要能一眼分清「开关永远返回 false」和**我这把尺子没基准**：`markLensSurfaces()` 有三道闸
    // （有画面 rect / 这一面看得见 / 重叠 ≥2%），R108 这台机器上一次报 5 条红，读数全指向第一道 ——
    // 暂停且负载 7+ 时解码器不交纹理，`videoWidth=0`，rects 直接空，于是每个面都「没压到画面」。
    // 那是量具缺基准，不是材质坏了（`devtools/r109-why-no-lens.js` 逐闸打印过一遍）。
    ok('至少一个面当前压在画面上并开着透镜（开关不是永远返回 false）', lensMarked >= 1,
        `lens-on ${lensMarked} 个，运行时报 ` +
        `${(typeof glassState === 'object' && glassState) ? glassState.lensLive : '?'} 个` +
        `｜三道闸：画面 rect=${paintedRects().length} 面板 shown=${shown('.header-collapsed .header-actions-group')}` +
        ` 重叠=${(() => { const pr = paintedRects(), pe = document.querySelector('.header-collapsed .header-actions-group');
            if (!pe || !pr.length) return '无 rect';
            const b = pe.getBoundingClientRect(); let cov = 0;
            for (const p of pr) { const y = Math.min(b.bottom, p.bottom) - Math.max(b.top, p.top);
                const w = Math.min(b.right, p.right) - Math.max(b.left, p.left); if (y > 0 && w > 0) cov += y * w; }
            return (100 * Math.min(1, cov / (b.width * b.height))).toFixed(1) + '%'; })()}`);
    hdr()?.classList.remove('active'); await sleep(400);

    // ---- 1b. 任何一条边都不许画两遍 ---------------------------------------------------------------
    // 玻璃面本来就有一圈 1px 边框，再叠一条**锐利**（blur ≤ 1.5px）的 inset 高光，两条并排就是「多出一
    // 条线」。R103 修的是下边（`inset 0 -1px`），R105 真机又指出上边粗一点 —— 同一个缺陷，只是换了方向，
    // 而上一版判据只查 `y < 0`（向下），所以顶部那条 `inset 0 1px 0` 从头到尾都是绿的。现在四条边都查。
    const doubled = [];
    for (const [name, sel] of Object.entries(SURFACES)) {
        const n = document.querySelector(sel);
        if (!n) continue;
        const cs = getComputedStyle(n);
        const insets = (cs.boxShadow || '').split(/,(?![^(]*\))/).filter((s) => /inset/.test(s))
            .map((s) => (s.match(/-?[\d.]+px/g) || []).map(parseFloat))
            .filter((nums) => nums.length >= 3 && nums[2] <= 1.5);   // 锐利的才算「一条线」，软阴影不是
        const onEdge = (k) => insets.filter((x) => (
            (k === 'Bottom' && x[1] < 0) || (k === 'Top' && x[1] > 0)
            || (k === 'Left' && x[0] > 0) || (k === 'Right' && x[0] < 0))).length;
        for (const k of ['Top', 'Right', 'Bottom', 'Left']) {
            const hasBorder = parseFloat(cs['border' + k + 'Width']) > 0 && cs['border' + k + 'Style'] !== 'none';
            if (hasBorder && onEdge(k)) {
                doubled.push(`${name}.${k}: border=${cs['border' + k + 'Width']} + ${onEdge(k)} 条锐利 inset`);
            }
        }
    }
    ok('五个玻璃面四条边都没有画两遍（任一条边：1px 边框 + 锐利 inset 不能并存）', doubled.length === 0, doubled.join(' | '));

    // ---- 1b-1. 同一条规则要在全应用成立，不只那五个面（R106 用户问「其他地方还有没有」）--------------
    // R103/R104/R105 连着三轮都是「修了量到的那几个面，别处还留着同一个缺陷」：成因写在 token 里
    // （`--elev-float` 带一条 `inset 0 1px 0`），而调用它的六个面**全都有 1px 边框**。只查那五个透镜面
    // 就永远查不出第六个（`#exportPill` 就是这么漏的）。所以这里改成走一遍 `body *`：任何看得见的元素，
    // 一条边不许同时有边框 + 锐利 inset，也不许有「0 偏移 + spread 环」把四条边一起加粗。
    const scanEdges = () => {
        const found = [];
        for (const el of document.querySelectorAll('body *')) {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 24 || r.height < 16) continue;
            const sharp = (cs.boxShadow || '').split(/,(?![^(]*\))/).filter((s) => /inset/.test(s))
                .map((s) => (s.match(/-?[\d.]+px/g) || []).map(parseFloat))
                .filter((n) => n.length >= 3 && n[2] <= 1.5);
            if (!sharp.length) continue;
            const rings = sharp.filter((n) => n[0] === 0 && n[1] === 0 && (n[3] || 0) > 0);
            const lbl = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
                + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
            for (const [k, dir] of Object.entries({ Top: 1, Right: -1, Bottom: -1, Left: 1 })) {
                const bw = parseFloat(cs['border' + k + 'Width']) || 0;
                if (!(bw > 0 && cs['border' + k + 'Style'] !== 'none')) continue;
                const axis = k === 'Left' || k === 'Right' ? 0 : 1;
                const n = sharp.filter((s) => s[axis] * dir > 0).length + rings.length;
                if (n) found.push(`${lbl}·${k}: border=${bw}px + ${n} 条锐利 inset`);
            }
        }
        return found;
    };
    const appDoubled = scanEdges();
    ok('全应用没有任何一条边被画两遍（body 里每个可见元素都查）', appDoubled.length === 0,
        `${appDoubled.length} 处：${appDoubled.slice(0, 8).join(' | ')}`);

    // ---- 1b-1′. 同一遍扫描要跑在**关着的面**上 ---------------------------------------------------
    // 上面那条只查 `display !== none` 的元素，所以抽屉/目录浏览器/长按菜单关着的时候整块是盲区 ——
    // R117 的 A6（`.dir-volume-chip.has-clips` 一圈 border 再加一条同色 inset 环）就是这么漏掉的：
    // 它不是新缺陷类型，是扫描范围没覆盖到。把三个面开起来再扫一遍，才是「全应用」这句话的意思。
    let closedDoubled = [];
    {
        const openIt = (fn) => { try { fn(); } catch (e) { /* 打不开就少查一块，下面如实报 */ } };
        openIt(() => { document.querySelector('.header-right')?.classList.add('active'); });
        // R182: 长按菜单要走产品自己的 `showCardContextMenu` —— 光挂 `.show` 类时标题格
        // (`#cardContextTitle`) 是空的，后面那份字号普查量的就是一块没有字的标题，
        // 标题行自己那一档字号永远进不了账（这一档 12.16px 就是这么躲过 R134 的）。
        openIt(() => { const ev = (window.viewer?.eventGroups || [])[0];
            if (ev && window.viewer?.showCardContextMenu) window.viewer.showCardContextMenu(ev);
            else { document.body.classList.add('context-open');
                document.querySelector('.card-context-menu')?.classList.add('show'); } });
        openIt(() => { window.viewer?.openAndroidFolderBrowser?.(); });
        await sleep(700);
        closedDoubled = scanEdges().filter((x) => !appDoubled.includes(x));
        openIt(() => { document.querySelector('.header-right')?.classList.remove('active'); });
        // 标题格里的字留着（后面那份字号普查要量它），但遮罩/`contextCard` 交还给产品自己收，
        // 不然这套件后面几处量长按菜单几何的判据会拿到一个半开的面。
        openIt(() => { if (window.viewer?.hideCardContextMenu) window.viewer.hideCardContextMenu();
            else { document.body.classList.remove('context-open');
                document.querySelector('.card-context-menu')?.classList.remove('show'); } });
        openIt(() => { const m = document.querySelector('#androidDirModal');
            if (window.viewer?.closeAndroidFolderBrowser) window.viewer.closeAndroidFolderBrowser();
            else m?.classList.remove('active', 'show'); });
        await sleep(400);
    }
    ok('把 ⋮ 面板/长按菜单/目录浏览器开起来再扫一遍，仍然没有边被画两遍（R117 A6）',
        closedDoubled.length === 0,
        closedDoubled.length ? `${closedDoubled.length} 处：${closedDoubled.slice(0, 6).join(' | ')}`
            : '关着的面此前是盲区，这一遍才覆盖到');
    const chip = document.querySelector('.dir-volume-chip.has-clips')
        || [...document.querySelectorAll('style')].length && null;
    ok('「有录像」chip 现在是一条边（无 inset 环），强调靠 1.5px 单条描边',
        !chip || !/inset/.test(getComputedStyle(chip).boxShadow || ''),
        chip ? `border=${getComputedStyle(chip).borderTopWidth} shadow=${getComputedStyle(chip).boxShadow}`
            : '本轮 chip 不在 DOM（目录浏览器已关）⇒ 由上一遍扫描担保');

    // ---- 1b-2. 材质跟着内容走：背后没东西的面不许要滤镜 ------------------------------------------
    // R105 实测：底部条 / 找片hero 在竖屏横屏都 0% 压在画面上，⋮ 面板 38–47%，卡片横屏 82%。透镜在这些
    // 面上是纯开销（真机 delta_p95 8.2ms），所以 `markLensSurfaces()` 按重叠面积逐拍开关 `.lens-on`。
    // 判据两头都要看：开着的面确实压在画面上（否则开关没生效），没压着的面确实没有 backdrop-filter。
    // 阈值直接读运行时那个常数，别在这儿抄一份数字 —— 抄的那份会在下次调参时变成一条假失败。
    const MIN = (typeof LENS_MIN_COVER === 'number') ? LENS_MIN_COVER : 2;
    const lensAudit = [];
    for (const [name, sel] of Object.entries(SURFACES)) {
        const n = document.querySelector(sel);
        if (!n) continue;
        if (!shown(sel)) { lensAudit.push(`·${name} 不可见，不参与`); continue; }
        const r = n.getBoundingClientRect();
        let cov = 0;
        for (const p of paintedRects()) {
            const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
            const w = Math.min(r.right, p.right) - Math.max(r.left, p.left);
            if (y > 0 && w > 0) cov += y * w;
        }
        const pct = 100 * Math.min(1, cov / (r.width * r.height));
        const bfNow = bf(sel) || 'none';
        // 判的是**透镜**在不在，不是「有没有任何滤镜」：R39-3/R59 那层普通模糊不在本轮开关范围内
        // （列表页底部条背后是真有滚动内容，那层模糊是给它准备的），拿 `!== 'none'` 判会把每一面都误报。
        const hasLens = /url\(/.test(bfNow);
        // 两侧各留 0.5pp 余量吸收「250ms 几何节拍」和「判据此刻量」之间的时间差（画面在播，letterbox 会变）。
        if (pct < MIN - 0.5 && hasLens) lensAudit.push(`${name}: 画面只有 ${pct.toFixed(1)}% 却还挂着透镜`);
        if (pct > MIN + 0.5 && !hasLens) lensAudit.push(`${name}: 压在画面 ${pct.toFixed(1)}% 上却没开透镜`);
        lensAudit.push(`·${name} ${pct.toFixed(1)}%/${hasLens ? '透镜' : '平'}`);
    }
    const lensViolations = lensAudit.filter((s) => !s.startsWith('·'));
    ok('材质跟着内容走（压在画面上才有透镜，背后是纯色/纯黑的不许白付 GPU）',
        lensViolations.length === 0, lensAudit.join(' ').replace(/·/g, ' ').trim() + ` 阈值=${MIN}%`);

    // ---- 1b2. 一圈边框必须是一种颜色（R103 的修法留下的缺陷，R104 真机指出） ----------------------
    // 为了消掉「两条线并排」，我把下边框换成了暗色 —— 结果是一条边三种观感：上/左/右是亮的，下是暗的；
    // 而暗色那条压在黑底（letterbox / 页面底）上直接看不见，卡片读成「边框不完整」。判据不看代码：
    // 每个挂了透镜的面，四条边的 computed color 只能有一种。深度感由外阴影负责（和其它玻璃面一致）。
    const mixed = [];
    const widths = [];
    for (const [name, sel] of Object.entries(SURFACES)) {
        const n = document.querySelector(sel);
        if (!n) continue;
        const cs = getComputedStyle(n);
        const sides = ['Top', 'Right', 'Bottom', 'Left'].map((k) => cs['border' + k + 'Color']);
        const distinct = [...new Set(sides)];
        if (distinct.length !== 1) mixed.push(`${name}: ${distinct.join(' vs ')}`);
        // 用户这轮的话是「顶部线条要粗一点」—— 观感上的「粗」可以是颜色叠加，也可以真是边框宽度不一致。
        // 上一版只查了色，没查宽；这里把四条边的 computed width 也收成一组，一圈必须等宽。
        const w = ['Top', 'Right', 'Bottom', 'Left'].map((k) => parseFloat(cs['border' + k + 'Width']) || 0);
        if (new Set(w).size !== 1) widths.push(`${name}: T/R/B/L=${w.join('/')}`);
    }
    ok('五个玻璃面四条边是同一种颜色（不许单独把下边改成暗色）', mixed.length === 0, mixed.join(' | '));
    ok('五个玻璃面四条边等宽（「顶部粗一点」的另一半成因）', widths.length === 0, widths.join(' | '));
    // 深度感的来源：R104 那版靠「外阴影 + 顶部内高光」两条撑着，而顶部内高光正是 R105 真机看到的「上边
    // 粗一点」。现在只留外阴影 —— 和 app 里其它玻璃面（6210/6274/6477 那几条）同一套做法。所以判据反过来：
    // 外阴影必须在，且这些面上**一条 inset 都不许有**（1b 只查了「和边框并排」的那种，这里查全部）。
    const depth = [];
    for (const [name, sel] of Object.entries(SURFACES)) {
        const n = document.querySelector(sel);
        if (!n) continue;
        const sh = getComputedStyle(n).boxShadow || 'none';
        const outer = (sh.match(/rgba?\([^)]*\)\s+-?[\d.]+px\s+[\d.]+px\s+[\d.]+px/g) || []).length;
        if (outer < 1 || /\binset\b/.test(sh)) depth.push(`${name}: outer=${outer} inset=/\\binset\\b/.test(sh) [${sh.slice(0, 52)}]`);
    }
    ok('深度感只剩外阴影（每个玻璃面至少一条外阴影，且一条 inset 都没有）', depth.length === 0, depth.join(' | '));

    // R111：透度（底色）不许参与过渡。求解器写出去的是**已经逐面验过 AA 的那一档**，而 CSS 过渡会让面
    // 在 0.3 秒里滑过中间值 —— 中间值谁都没验过（对比度对 alpha 非单调，R103 记的就是这件事）。
    // 起因是一条实测读数：150 拍里 16 拍「面上的 alpha ≠ CSS 变量」，最长一次连着 800 ms 停在**上一档**，
    // 审计那次更是 面 0.45 / 变量 0.548 —— 卡片比求解结果更透。迟滞已经把变化做成「四秒一档」，
    // 中间不该再补一层滑行；观感上也就少一次「颜色慢慢变过去」，而那正是用户报的「颜色还是会变」。
    const animOf = (n) => {
        const c = getComputedStyle(n);
        const ps = (c.transitionProperty || '').split(',').map((x) => x.trim()).filter(Boolean);
        const ds = (c.transitionDuration || '').split(',').map((x) => parseFloat(x) || 0);
        const bad = [];
        ps.forEach((p, i) => {
            const d = i < ds.length ? ds[i] : ds[ds.length - 1];
            if (d > 0 && /background|color|^all$/i.test(p)) bad.push(`${p}=${d}s`);
        });
        return bad;
    };
    const bgAnim = [];
    for (const [name, sel] of Object.entries(SURFACES)) {
        const n = document.querySelector(sel);
        if (!n) continue;
        const bad = animOf(n);
        if (bad.length) bgAnim.push(`${name}: ${bad.join(',')}`);
    }
    ok('玻璃面的底色/透度不参与任何过渡（过渡中间值没有被验过 AA）', bgAnim.length === 0, bgAnim.join(' | ') || '无一面的 transition 里带 background/color');

    // R112 ①：用户确认「面板一出现，它自己先浅后深 / 先透后白地变一下」。量到的成因：⋮ 面板入场靠
    // `opacity 0→1 / 0.2s`，而这一块是**玻璃** —— 元素 opacity 是乘在板的 alpha 上的，所以淡入期间
    // 材质自己从「几乎没有」走到求解器那一档（底色 alpha 全程 .9 不动，动的是 opacity）。
    // 判据必须在**打开态**读：关闭那一边的规则里 opacity 是合法的（退场仍要淡出，不然菜单凭空消失）。
    // 加类→读→摘类放进同一个同步任务（R107：状态推送会把手工加上去的类摘掉）。
    const hrEl = document.querySelector('.header-right');
    const pnlEl = document.querySelector('.header-collapsed .header-actions-group');
    let enterAnim = '(读不到面板)';
    if (hrEl && pnlEl) {
        const was = hrEl.classList.contains('active');
        hrEl.classList.add('active');
        const c = getComputedStyle(pnlEl);
        const ps = (c.transitionProperty || '').split(',').map((x) => x.trim()).filter(Boolean);
        const ds = (c.transitionDuration || '').split(',').map((x) => parseFloat(x) || 0);
        enterAnim = ps.filter((p, i) => (i < ds.length ? ds[i] : ds[ds.length - 1]) > 0).join(',') || '无';
        if (!was) hrEl.classList.remove('active');
    }
    ok('⋮ 面板入场不淡入（打开态 transition 里没有 opacity/all；退场保留淡出）',
        !/(^|,)\s*(opacity|all)\s*(,|$)/.test(enterAnim), `打开态在动的属性=${enterAnim}`);

    // R114 · 把「一种墨把整组白玻璃钉厚」这条路钉死。用户真机 alphaLog 指出来开机→播放那一下
    // .45→.842 是品牌紫一个人要的（白底 2.6:1，本来就不过 AA）。浅色主题那份压暗到 #2210c5 之后：
    // ① 它在白底必须过 AA；② 它在中灰底上不许再向材质要厚度（≤.46）。深色主题那份是**文字色**，
    // 必须保持原来的亮紫 —— 一起压暗会把白字药丸之外的深色面文字换掉，那是另一套账。
    // 加类→读→摘类放进同一个同步任务（R107：状态推送会把手工加上去的类摘掉）。
    const bdEl = document.body;
    const wasDark = bdEl.classList.contains('dark-theme');
    const tintProbe = () => {
        const t = (getComputedStyle(bdEl).getPropertyValue('--glass-tint') || '').trim();
        // token 写的是十六进制，不是 rgb() —— 只按 `[\d.]+` 拆会得到空数组，量具坏了看着像代码坏了。
        let m = [];
        const hx = t.match(/^#([0-9a-f]{6})$/i);
        if (hx) m = [0, 2, 4].map((i) => parseInt(hx[1].slice(i, i + 2), 16));
        else m = (t.match(/[\d.]+/g) || []).map(Number);
        if (m.length < 3) return { t, ok: false };
        // 用 APP 自己的 contrastRatio —— 它做 sRGB 反伽马。判据第一版自己写了个线性亮度和，
        // 对饱和蓝会算错（旧紫真值 5.66:1，线性那版给 2.6），差点把「谁没过 AA」判反。
        const comp = (a) => [0, 1, 2].map((k) => 255 * a + 100 * (1 - a));   // 白玻璃 .45 垫在中灰视频上
        return {
            t, ok: true,
            onWhite: +contrastRatio(m, [255, 255, 255]).toFixed(2),
            onGlass45: +contrastRatio(m, comp(0.45)).toFixed(2),
            need: +solveGlassAlpha([255, 255, 255], [100, 100, 100], [m]).toFixed(3),
        };
    };
    let lightTint = { ok: false }, darkTint = { ok: false };
    if (wasDark) bdEl.classList.remove('dark-theme');
    lightTint = tintProbe();
    if (wasDark) bdEl.classList.add('dark-theme');
    else bdEl.classList.add('dark-theme');
    darkTint = tintProbe();
    bdEl.classList.toggle('dark-theme', wasDark);
    ok('浅色品牌紫不再向材质要厚度，且自己在半透玻璃上也过 AA（R114）',
        lightTint.ok && lightTint.onGlass45 >= 4.5 && lightTint.need <= 0.46,
        `浅=${lightTint.t} 白底=${lightTint.onWhite}:1 玻璃(.45垫中灰)=${lightTint.onGlass45}:1 中灰底玻璃需求=${lightTint.need}（要 ≤.46 且玻璃上 ≥4.5）`);
    ok('深色主题那一份文字紫没被顺手压暗（R114）',
        darkTint.ok && /^#b9aeff$/i.test(darkTint.t), `深=${darkTint.t}（应保持 #b9aeff：它是文字色，白字药丸另算）`);

    // ---- 1b′. R115「页面 UI 没有统一」：普查数出来的落单项，判的是**计算值 ------------------
    // 取证脚本 devtools/r115-census.js（控件档：高/圆角/字号/内缩）+ r115-text.js（文字角色）。
    // 为什么读 computed style 而不是 rect：导出页、目录浏览器、关于页在这一刻是**关着的**
    // （祖先 display:none，rect 全 0），但 border-radius / min-height / font-size 这些计算值照样解析
    // —— 这正好是「样式表有没有收到同一档」的最小可验形态（R42 的教训：只测 JS 状态会漏整份 CSS）。
    const px1 = (x) => Math.round(parseFloat(x) * 100) / 100;
    const prop = (el, p) => (el ? px1(getComputedStyle(el)[p]) : NaN);
    const tokOf = (el, name) => (el ? (getComputedStyle(el).getPropertyValue(name) || '').trim() : '');
    // 自定义属性不能按 `getComputedStyle(el)['--x']` 读（那是 undefined，量具坏了看着像代码坏了 ——
    // R99 记过驼峰名，这条是同一族）；十六进制 token 也不能按 `[\d.]+` 拆（R114 记过）。
    const numTok = (el, name) => px1(tokOf(el, name));
    const rgbOf = (colorText) => {
        const s = document.createElement('span');
        s.style.color = colorText;
        s.textContent = '·';
        document.body.appendChild(s);
        const m = (getComputedStyle(s).color.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
        s.remove();
        return m.length === 3 ? m : null;
    };
    const R_CARD = tokOf(document.documentElement, '--r-card');
    const faces = {
        drawer: document.querySelector('.sidebar'),
        panel: document.querySelector('.header-collapsed .header-actions-group'),
        exp: document.querySelector('.phone-export-panel'),
        dir: document.querySelector('.dir-modal-content'),
        about: document.querySelector('.about-panel'),
        gesture: document.querySelector('.gesture-panel'),
    };
    const q = (sel) => document.querySelector(sel);

    // ① 两处直选段：⋮ 面板的 `.choice-segments` 与导出页的 `.pe-seg`（代码注释本来就写着「同一个控件」，
    //    R115 普查实测却是轨 44/胶囊 vs 36/圆角8、段 40 vs 32、选中态一边品牌紫一边灰底）。
    const segA = q('.choice-segments'), segB = q('.pe-seg');
    const segBtnA = segA && segA.querySelector('.choice-segment');
    const segBtnB = segB && segB.querySelector('button');
    const segSame = segBtnA && segBtnB
        && getComputedStyle(segA).borderTopLeftRadius === getComputedStyle(segB).borderTopLeftRadius
        && getComputedStyle(segBtnA).borderTopLeftRadius === getComputedStyle(segBtnB).borderTopLeftRadius
        && prop(segBtnA, 'minHeight') === prop(segBtnB, 'minHeight')
        && prop(segBtnA, 'fontSize') === prop(segBtnB, 'fontSize');
    ok('两处直选段是同一档（轨道圆角 / 段圆角 / 段高 / 字号全等，R115）', !!segSame,
        segBtnA && segBtnB ? `轨 rad ${getComputedStyle(segA).borderTopLeftRadius}|${getComputedStyle(segB).borderTopLeftRadius}`
            + ` 段 rad ${getComputedStyle(segBtnA).borderTopLeftRadius}|${getComputedStyle(segBtnB).borderTopLeftRadius}`
            + ` 段高 ${prop(segBtnA, 'minHeight')}|${prop(segBtnB, 'minHeight')} 字 ${prop(segBtnA, 'fontSize')}|${prop(segBtnB, 'fontSize')}` : '读不到其中一段');
    ok('两处直选段的**段高**都在 40px 触摸下限上（R115：导出页原来是 32）',
        !!segBtnA && !!segBtnB && prop(segBtnA, 'minHeight') >= 40 - 0.5 / devicePixelRatio && prop(segBtnB, 'minHeight') >= 40 - 0.5 / devicePixelRatio,
        `${prop(segBtnA, 'minHeight')} / ${prop(segBtnB, 'minHeight')}`);

    // ② chip 一档：抽屉 `.date-chip` 与导出页 `.pe-chips .recent-chip`（原来 44/圆角12 vs 40/圆角12，
    //    横屏再掉到 36）。现在都走**所在面的 `--field-h`**；R136（#375）把横屏那档也收到 40，
    //    两个方向的字段与 chip 现在是同一档。
    const chipA = q('.date-chip'), chipB = q('.pe-chips .recent-chip');
    ok('两处 chip 同圆角、同字号，且都在 40px 触摸下限上（R115）', !!chipA && !!chipB
        && getComputedStyle(chipA).borderTopLeftRadius === getComputedStyle(chipB).borderTopLeftRadius
        && prop(chipA, 'fontSize') === prop(chipB, 'fontSize')
        && prop(chipB, 'minHeight') >= 40 - 0.5 / devicePixelRatio,
        chipA && chipB ? `rad ${getComputedStyle(chipA).borderTopLeftRadius}|${getComputedStyle(chipB).borderTopLeftRadius}`
            + ` 字 ${prop(chipA, 'fontSize')}|${prop(chipB, 'fontSize')} 导出页 chip 高 ${prop(chipB, 'height')}（min ${prop(chipB, 'minHeight')}，面 --field-h=${tokOf(faces.exp, '--field-h')}）` : '读不到');

    // ③ 面板底部那颗主按钮跟同面字段同档（原来 40/圆角8/13.76，同面字段是 44/圆角12）。
    const ctaA = q('#selectFolderBtn'), ctaB = q('#androidDirSelectBtn');
    ok('抽屉主按钮与目录浏览器主按钮同档：圆角=--r-card、字号=--fs-body、高度=面 --field-h（R115）',
        !!ctaA && !!ctaB
        && getComputedStyle(ctaA).borderTopLeftRadius === R_CARD
        && getComputedStyle(ctaB).borderTopLeftRadius === R_CARD
        && prop(ctaA, 'fontSize') === prop(ctaB, 'fontSize')
        && prop(ctaA, 'height') === numTok(faces.drawer, '--field-h')
        && prop(ctaA, 'height') >= 40 - 0.5 / devicePixelRatio,
        `抽屉按钮 高 ${prop(ctaA, 'height')}（面 --field-h=${numTok(faces.drawer, '--field-h')}）rad ${getComputedStyle(ctaA).borderTopLeftRadius}`
        + `｜目录按钮 rad ${getComputedStyle(ctaB || document.body).borderTopLeftRadius} 字 ${prop(ctaB, 'fontSize')}｜--r-card=${R_CARD}`);

    // ④ 一个面里不许两种圆角：目录浏览器曾有 22 胶囊 / 8 / 10 三种。
    //    这一组控件**只有把目录浏览器打开才存在**（ chips 是扫盘后渲染的；本轮实测：没开的时候
    //    `.dir-volume-chip` 数量 = 0）。判据没走过的分支等于没验过（R97/R114 那条教训），所以这里
    //    自己把它开起来、量完、关回去；关不掉就把「没回到关闭态」报出来，而不是让下一条判据背着
    //    一个开着的模态跑完剩下的 40 条。
    const dirSel = ['#androidDirUpBtn', '.dir-volume-chip', '#androidDirSelectBtn'];
    let dirState = '';
    const dirOpen = async () => {
        try { await window.viewer?.openAndroidFolderBrowser?.(); } catch (e) { return 'open threw ' + e; }
        for (let i = 0; i < 24; i++) {
            if (document.querySelectorAll('.dir-volume-chip').length > 0) return '';
            await sleep(250);
        }
        return '没扫出任何 volume chip';
    };
    const dirFail = await dirOpen();
    const dirSet = dirSel.map((s) => {
        const e = q(s);
        return [s, e ? getComputedStyle(e).borderTopLeftRadius : 'ABSENT'];
    });
    const dirNumChips = document.querySelectorAll('.dir-volume-chip').length;
    q('#androidDirCloseBtn')?.click();
    await sleep(600);
    const dirClosed = getComputedStyle(q('#androidDirModal') || document.body).display === 'none';
    ok('目录浏览器三颗可点控件收到同一档圆角（R115；自己把面板开起来量的）',
        !dirFail && dirClosed && dirNumChips > 0 && dirSet.every(([, r]) => r === R_CARD),
        `chips=${dirNumChips} 关回去=${dirClosed ? 'yes' : 'NO'} ${dirFail || ''} `
        + dirSet.map(([s, r]) => `${s.replace(/[#.]/g, '').slice(0, 16)}=${r}`).join(' ') + `｜--r-card=${R_CARD}`);

    // ⑤ 标题一档：实测原来 16/600、15.68/600、16.8/700 三档并存。
    const titles = ['.pe-nav .pe-nav-title', '.dir-modal-content h4', '.about-panel h4', '.gesture-panel h4']
        .map((s) => { const e = q(s); const c = e ? getComputedStyle(e) : null; return [s, c ? `${c.fontSize}/${c.fontWeight}` : 'ABSENT']; });
    ok('四处面板标题同档 16px/600（R115）',
        titles.every(([, val]) => val === '16px/600'), titles.map(([s, val]) => `${s.split(' ').pop()}=${val}`).join(' '));

    // ⑥ 两份「次要灰」判为**不能并**（styles.css 5421 那段把两个方向的代价都记下来了）。这一条守的
    //    不是「并色」，是**并色会踩坏的那件不变量**：浅色主题下，白玻璃上每一种实际墨色的需求
    //    都不许超过 .46 —— 也就是 R114 的成果「开机和播放都是 .45，没有东西可跳」不能被任何一种墨
    //    重新顶厚。（本轮我自己就写错过一次：把 --text-secondary 指到 --modal-muted，浅色需求
    //    .45 → .842，装机前跑这套才拦住。）同时把两份灰各自的 AA 现测一起报出来，方向②的那条
    //    代价（#6c757d 在弹层底 4.43:1）也是「不并」的理由之一。
    /** 这支字是不是真的对着玻璃读（和 script.js 里 `paintsOnGlass` 同一套判据，独立实现用来交叉核对）：
     *  从自己往上到这一面为止，只要有一层刷了和玻璃底色明显不同的近不透明底，它就是压在自己的
     *  小药丸上 —— 选中段里那支白字最典型。不滤掉它，「有没有救不了的墨」这条判据会永远假红。 */
    const onGlassHere = (n, host, fill) => {
        for (let p = n; p && p !== host; p = p.parentElement) {
            const bg = getComputedStyle(p).backgroundColor, v = parseInk(bg);
            if (v.length !== 3) continue;
            const m = bg.match(/rgba\([^()]*,\s*([\d.]+)\s*\)/);
            const a = m ? parseFloat(m[1]) : 1;
            if (a > 0.5 && v.some((x, i) => Math.abs(x - fill[i]) > 12)) return false;
        }
        return true;
    };
    const BAND = [40, 70, 98, 130, 167, 197, 230, 255];
    const glassInks = () => {
        const faces = ['.phone-action-bar', '.card-context-menu', '.header-collapsed .header-actions-group'];
        const per = [];
        for (const sel of faces) {
            const el = q(sel);
            if (!el) continue;
            const fill = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
            if (fill.length < 3) continue;
            const set = new Set();
            for (const n of [el, ...el.querySelectorAll('span,a,button,label,.btn-text,.menu-divider,.tab-label')]) {
                if (!(n.textContent || '').trim()) continue;
                if (!onGlassHere(n, el, fill)) continue;
                const c = getComputedStyle(n).color;
                const m = (c.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
                if (m.length === 3 && c.startsWith('rgb')) set.add(m.join('/'));
            }
            for (const k of set) {
                const ink = k.split('/').map(Number);
                let worst = 0, unsav = 0;
                for (const L of BAND) {
                    const bd = [L, L, L];
                    if (glassInkConstraints(fill, bd, [ink]).unsavable.length) unsav += 1;
                    worst = Math.max(worst, solveGlassAlpha(fill, bd, [ink]));
                }
                per.push({ face: sel.replace(/[.># ]/g, '').slice(0, 16), ink: k, fill,
                    need98: +solveGlassAlpha(fill, [98, 98, 98], [ink]).toFixed(3),
                    worst: +worst.toFixed(3), unsav } );
            }
        }
        return per;
    };
    const wasDarkNow = document.body.classList.contains('dark-theme');
    document.body.classList.remove('dark-theme');
    const lightInks = glassInks();
    const lightMuted = rgbOf(tokOf(document.body, '--modal-muted')), lightAlt = rgbOf(tokOf(document.body, '--text-secondary'));
    document.body.classList.add('dark-theme');
    const darkInks = glassInks();
    const darkMuted = rgbOf(tokOf(document.body, '--modal-muted')), darkAlt = rgbOf(tokOf(document.body, '--text-secondary'));
    document.body.classList.toggle('dark-theme', wasDarkNow);
    // R121 改写过的不变量。原来那条写的是「任何墨都不许把白玻璃顶过 .46」，它守的是 R114 的成果，
    // 但它的**实现方式**是把顶不动的墨判为「救不了」再踢出约束 —— 踢掉之后那支墨照样以 1.4–4.4:1
    // 画在屏幕上，没人报（真机 1.2.202 的 `subAa=3/worst=1.04` 就是这笔账）。B 方案换了目标：
    // **宁可暗画面上厚一点（.45 → 最坏 .646），也不要亮画面上 .92 的白板，也不要静默失配。**
    // 所以这一条判两件事：① 全段底色最大需求 ≤.66；② 出现「救不了」的墨只许在下面这张
    // **显式豁免清单**里。为什么不是「一条都不许有」：长按菜单那支危险红是白玻璃任何厚度都救不了
    // 的（R103 起就接受了的例外），写成零容忍会天天假红 —— 而天天红的判据和没有判据一样没人看。
    // 清单之外多出一支「救不了」= 有人往玻璃上加了一种日常字色，那正是这次要防的那类回归。
    const UNSAV_EXEMPT = { '255/69/58': '长按菜单危险红：白玻璃救不了它（R103 起的已知例外）' };
    const unsavInks = [...new Set(lightInks.filter((x) => x.unsav > 0).map((x) => x.ink))];
    const unsavBad = unsavInks.filter((k) => !UNSAV_EXEMPT[k]);
    const worstLight = lightInks.reduce((a, b) => (b.worst > a.worst ? b : a), { worst: 0, unsav: 0, ink: '-', face: '-' });
    ok('浅色主题：白玻璃全档最大需求 ≤.66，且「救不了」的墨只在豁免清单里（R121 改写 R115 的不变量）',
        worstLight.worst <= 0.66 && unsavBad.length === 0,
        `最差 ${worstLight.face} 墨=${worstLight.ink} 全档最厚需求=${worstLight.worst}`
        + `（底=98 时 ${worstLight.need98}）｜救不了的墨=${unsavInks.join(',') || '无'} 清单外=${unsavBad.join(',') || '无'}`
        + `｜浅色两份灰 #6c757d / #5f6773 在弹层白底 ${lightAlt ? contrastRatio(lightAlt, [255, 255, 255]).toFixed(2) : '?'}:1 / ${lightMuted ? contrastRatio(lightMuted, [255, 255, 255]).toFixed(2) : '?'}:1`);
    ok('两份次要灰各自过 AA（R115 的「不并」结论仍然成立；R121 去掉了那条**假绿**的末项）',
        !!lightMuted && !!darkMuted && !!darkAlt
        && contrastRatio(lightMuted, [255, 255, 255]) >= 4.5
        && contrastRatio(darkMuted, [32, 34, 44]) >= 4.5,
        // 这一条原来还带一项 `solveGlassAlpha(浅 --text-secondary) ≤ .46`，看着像在防「灰把玻璃钉厚」，
        // 其实它**永远成立**：#6c757d 在底=98 是「救不了」的，而救不了的墨 solveGlassAlpha 直接返回
        // 最薄档 .45 —— 一个因为「没人保护它」而通过的判据，比没有判据更糟。玻璃那一侧现在由上面
        // 那条 R121 不变量守（全档有解 + ≤.66），这里只留两份灰各自的 AA 账。
        `浅 --modal-muted=${lightMuted.join('/')} 白底 ${contrastRatio(lightMuted, [255, 255, 255]).toFixed(2)}:1`
        + `｜浅 --text-secondary=${lightAlt.join('/')} 白底 ${contrastRatio(lightAlt, [255, 255, 255]).toFixed(2)}:1`
        + `｜深 --modal-muted=${darkMuted.join('/')} 弹层底 ${contrastRatio(darkMuted, [32, 34, 44]).toFixed(2)}:1`);

    // R184 · 玻璃之外还有一整类面：`subAa` 只看那五面透镜，弹层（`--modal-panel` 是 .96 近不透明的白）
    // 根本不在账上 —— 于是「删除确认」里那句「直接从存储盘删除，没有回收站，删掉就恢复不了」
    // 用 `#ff9f0a` 写在近白面板上（2.10:1）一直没人看见。这一条把弹层自己的字逐个量一遍。
    {
        const modal = document.getElementById('deleteConfirmModal');
        const del = (v.eventGroups || []).find((e) => v.eventDeleteTargets(e));
        if (!modal || !del) {
            out.modalAa = `n/a（${modal ? '目录里没有可单独删除的事件' : '对话框不在 DOM'}）`;
        } else {
            v.openDeleteConfirm(del);
            await sleep(500);
            const panel = modal.querySelector('.modal-content');
            const pcs = getComputedStyle(panel);
            const pv = (pcs.backgroundColor.match(/[\d.]+/g) || []).map(Number);
            const pageBg = (getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
            const pa = pv.length === 4 ? pv[3] : 1;
            const comp = [0, 1, 2].map((k) => pv[k] * pa + (pageBg[k] || 255) * (1 - pa));
            const bad = [];
            for (const n of panel.querySelectorAll('h4, div, span, button, li, p')) {
                const txt = [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('').trim();
                if (!txt) continue;
                const cs2 = getComputedStyle(n);
                const ink = (cs2.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
                if (ink.length !== 3) continue;
                // 第一版在这里栽了：`backgroundColor` 是 `rgba(0,0,0,0)` 时我拿 [0,0,0] 当底，
                // 于是「删除这个事件？」这种深字被判成 1.26:1 —— 11 处红里 9 处是这么来的（假红）。
                // 只有**真的会画出来**的底才算，透明的一律回到面板合成底。
                const bv = (cs2.backgroundColor.match(/[\d.]+/g) || []).map(Number);
                const bAlpha = bv.length >= 4 ? bv[3] : (bv.length === 3 ? 1 : 0);
                const bg = bAlpha >= 0.5 ? bv.slice(0, 3) : comp;
                const c = contrastRatio(bg, ink);
                if (c < 4.5) {
                    bad.push(`${n.className || n.tagName} "${txt.slice(0, 10)}" 墨=${ink.join(',')} 底=${bg.map(Math.round).join(',')} ${c.toFixed(2)}`);
                }
            }
            out.modalAa = { panel: comp.map(Math.round).join('/'), bad };
            // 借来的前置自己收尾（今天刚为这条付过学费）。
            document.getElementById('deleteCancelBtn')?.click();
            modal.classList.remove('show');
            modal.style.display = 'none';
            v.pendingDelete = null;
            await sleep(250);
            ok('删除确认弹层里的字过 AA（R184：弹层不在玻璃账上，得单独量）',
                bad.length === 0, `面板合成底 rgb(${out.modalAa.panel})｜不合格 ${bad.length} 处：${bad.slice(0, 3).join(' | ') || '无'}`);
        }
    }

    // R134 · 字号统一这本账从「只记」翻成「断言」：每个手机面只许出现四档
    // （--fs-cap 11 / --fs-meta 12 / --fs-body 14.08 / --fs-lead 16）。
    // 不计：emoji 图标、× 关闭字形（`.close-modal-btn`，是图不是字）、压在画面上的注记
    // （`.pe-tile-name` 等，`--fs-cap` 注释里已豁免）。数据卡片**只记不判** ——
    // 用户 2026-10-21 明说「数据卡片就不动」，它还应该是那 8 档；数字变了说明有人碰了它。
    const FONT_TOKENS = [11, 12, 14.08, 16];
    const fontFaces = [['抽屉', '.sidebar'], ['⋮面板', '#headerActionsGroup'], ['顶栏', '.main-header'],
        ['播放控件', '.video-controls-container'], ['底部条', '.phone-action-bar'],
        ['导出页', '.phone-export-panel'], ['长按菜单', '.card-context-menu'], ['找片卡', '.empty-hero'],
        ['关于页', '.about-panel'], ['手势页', '.gesture-panel'], ['目录浏览器', '.dir-modal-content'],
        ['预览放大页', '#peZoomModal'], ['路径弹窗', '#filePathModal'],
        ['数据卡片', '#metadataPanel']];
    const fontSkip = (n) => /emoji/i.test(typeof n.className === 'string' ? n.className : '')
        || (typeof n.className === 'string' && /close-modal-btn|pe-tile-|meta-empty-place/.test(n.className));
    out.fontCensus = {};
    out.fontCensusBad = [];
    // R183: 这一遍原来只量 `span/div/button/a/label/h*/p` 且要求 `textContent` 非空 ——
    // 于是两类字永远进不了账：① 表单控件（`.pe-mark-name-input` 那类 13.44px 的输入框），
    // ② 由产品代码现填的标题（长按菜单 `.context-title` 的 12.16px 就是这么躲过 R134 的）。
    // 顺带把「哪一格是哪个元素」记下来：只报 12.16px 而不知道它挂在谁身上，查一次要半天。
    const fontNodes = 'span, div, button, a, label, h1, h2, h3, h4, p, input, textarea, select';
    // 只有「会把字画出来」的控件才算：`type=range` 的 `value="1"` 不是墨，算进去会凭空多出一档
    // （`#peWmScale` 就是这条，UA 默认 13.3333px 但它一个像素的字都不画）。
    const TEXTY = /^(text|search|tel|url|password|number|email|date|time)$/;
    const isTextControl = (n) => (n.tagName === 'TEXTAREA' || n.tagName === 'SELECT')
        || (n.tagName === 'INPUT' && TEXTY.test(n.type || 'text'));
    const fontText = (n) => isTextControl(n)
        ? (n.value || n.placeholder || (n.options && n.options[n.selectedIndex] && n.options[n.selectedIndex].text) || '')
        : (n.textContent || '');
    out.fontCensusWhere = {};
    // R160: `.metadata-loading` / `.metadata-empty` are 11.52px while the card is still loading or
    // showing the location fallback. Reading the census in that state counts a transient tier, so
    // wait until the metadata reader has settled before measuring the card.
    for (let i = 0; i < 60 && window.viewer?.metadataManager?.isLoading; i += 1) await sleep(200);
    for (const [name, sel] of fontFaces) {
        const host = document.querySelector(sel);
        if (!host) { out.fontCensus[name] = 'absent'; out.fontCensusBad.push(`${name}:absent`); continue; }
        const set = new Set(); const where = {};
        for (const n of [host, ...host.querySelectorAll(fontNodes)]) {
            if (!(fontText(n) || '').trim()) continue;
            if (n.children.length && ![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
            if (fontSkip(n)) continue;
            const fs2 = getComputedStyle(n).fontSize; if (parseFloat(fs2) > 0) {
                set.add(fs2);
                const tag = `${n.tagName.toLowerCase()}.${(typeof n.className === 'string' ? n.className.trim().split(/\s+/)[0] : '') || '-'}`;
                (where[fs2] = where[fs2] || new Set()).add(`${tag}「${(fontText(n) || '').trim().slice(0, 8)}」`);
            }
        }
        const sizes = [...set].sort((x, y) => parseFloat(x) - parseFloat(y));
        out.fontCensus[name] = sizes.join('/');
        if (name === '数据卡片') continue;
        const bad = sizes.filter((s) => !FONT_TOKENS.some((t) => Math.abs(parseFloat(s) - t) < 0.05));
        if (bad.length) out.fontCensusBad.push(`${name}:${bad.join(',')}`);
        if (bad.length) out.fontCensusWhere[name] = Object.fromEntries(bad.map((s) => [s, [...(where[s] || [])].slice(0, 3)]));
    }
    ok('R134 每个手机面只剩四档字号 11/12/14.08/16（数据卡片豁免；×/emoji/画面注记不计）',
        out.fontCensusBad.length === 0,
        out.fontCensusBad.slice(0, 5).join(' | ') || Object.entries(out.fontCensus).map(([k, v]) => `${k}=${v}`).join('｜'));
    ok('R134 数据卡片没被这一轮碰到（仍 8 档，用户明说不动）',
        out.fontCensus['数据卡片'] && out.fontCensus['数据卡片'].split('/').length === 8,
        `数据卡片=${out.fontCensus['数据卡片']}`);
    // ⑦ 低于 11px 的文字只剩「画面上注记」那一张豁免清单（`--fs-cap` 注释里就写了豁免谁）。
    //    判据扫的是**每个手机面的文字叶子**，所以新增一条会自己冒出来，不靠人记。
    const EXEMPT = ['metadata-label', 'meta-speed-unit', 'meta-gear', 'pe-tile-name', 'pe-tile-size',
        'filmstrip', 'thumb-', 'phone-brightness', 'stats-', 'btn-icon'];
    const under = [];
    for (const rootSel of ['.sidebar', '.header-collapsed .header-actions-group', '.phone-action-bar',
        '.phone-export-panel', '.metadata-panel', '.card-context-menu', '.dir-modal-content',
        '.about-panel', '.gesture-panel']) {
        const root = q(rootSel);
        if (!root) continue;
        for (const n of root.querySelectorAll('*')) {
            const t = (n.textContent || '').trim();
            if (!t || [...n.children].some((c) => (c.textContent || '').trim())) continue;
            const cls = (typeof n.className === 'string' ? n.className : '') + ' ' + n.tagName;
            if (EXEMPT.some((x) => cls.includes(x))) continue;
            if (parseFloat(getComputedStyle(n).fontSize) < 11) {
                under.push(`${prop(n, 'fontSize')}px .${cls.trim().split(/\s+/)[0]}「${t.slice(0, 6)}」`);
            }
        }
    }
    ok('手机各面没有低于 11px 的界面文字（豁免＝压在画面上的注记，R115）',
        under.length === 0, [...new Set(under)].slice(0, 6).join(' | ') || '全部 ≥11px');

    // ⑧ R97-9 那一批余下的两个靶子：目录浏览器的静默链接与 sheet 的 ×。
    //    × 现在归 `html.sheet-mode … > .close-modal-btn` 那条管，必须读**计算值**（面板没开时 rect=0）。
    const xBtn = q('#androidDirCloseBtn');
    ok('sheet 的关闭 × 靶子 ≥40（R115：原来 32×32）',
        !!xBtn && prop(xBtn, 'width') >= 40 - 0.5 / devicePixelRatio && prop(xBtn, 'height') >= 40 - 0.5 / devicePixelRatio,
        xBtn ? `${prop(xBtn, 'width')}×${prop(xBtn, 'height')}` : '读不到');
    const ql = q('#androidDirPathEdit');
    // 读 `min-height` 不读 `height`：这一行在 `html:not(.dir-compact)` 下是 `display:none`，
    // 没有盒子 → computed height 是 "auto" → parseFloat 得 NaN（判据坏了看着像控件坏了）。
    ok('目录浏览器「详情/编辑路径」静默链接 ≥40 高（R115：原来 34.1）',
        !!ql && prop(ql, 'minHeight') >= 40 - 0.5 / devicePixelRatio,
        ql ? `min-height ${prop(ql, 'minHeight')}（display=${getComputedStyle(ql).display}，开着量的实测高 ${prop(ql, 'height')}）` : '读不到');

    // ---- 1b″. R116「设置卡片和底部菜单栏中间的间隙偶尔有点问题」--------------------------------
    // 根因不是间隙本身：`--action-h` 是 JS 量的「底条高 + 底条到屏幕底」，而量的是
    // `getBoundingClientRect()` —— **画上去的位置**。底条在抽屉/长按菜单打开时被
    // `transform: translateY(14px)` 挪下去 14px（回来还要 .22s），那一次量就把 91 记成 77，
    // 而底条高度自始至终没变 ⇒ ResizeObserver 不再补量，77 就一直挂着。
    // 面板 `bottom: calc(--action-h + 12px)` 于是落在底条**里面** 2.6px（改前实测）。
    // 触发有两条路，第二条不需要运气：① 从抽屉里点事件 → 抽屉关、底条往回滑、播放器开始排版
    // → RO 在 220ms 里量了一次；② 原生状态推送本身就调 `publishControlReserve()`，
    // 而推送在抽屉开着的时候也会来。修法＝改量布局盒（offsetTop/offsetHeight，与 transform 无关）。
    const gBar = document.getElementById('phoneActionBar');
    // 「真实 occupied」按布局盒算，和被测对象用同一套数 —— 不然量具和被测一起错。
    const gLayout = () => (gBar.offsetHeight > 0
        ? Math.round(gBar.offsetHeight + Math.max(0, innerHeight - gBar.offsetTop - gBar.offsetHeight)) : 0);
    const gAct = () => px1(getComputedStyle(document.documentElement).getPropertyValue('--action-h'));
    const gWasCollapsed = document.body.classList.contains('sidebar-collapsed');
    const gRest = gLayout();
    ok('底条静置时 --action-h 就是它的布局占用（声明=实测）',
        Math.abs(gAct() - gRest) <= 1,
        `声明=${gAct()} 布局=${gRest} offsetTop=${gBar.offsetTop} h=${gBar.offsetHeight}`);
    // 把两条触发路都走一遍，并且**判在量完之后、落定之前** —— 只看落定后的值会被 RO 的补量蒙过去，
    // 而真机上没有那次补量（底条高度自始至终没变）。
    document.body.classList.remove('sidebar-collapsed');
    await sleep(320);
    v.publishControlReserve?.();
    const gDuring = { tf: getComputedStyle(gBar).transform, act: gAct() };
    document.body.classList.toggle('sidebar-collapsed', gWasCollapsed);
    await sleep(60);
    v.publishControlReserve?.();
    const gMid = gAct();
    await sleep(320);
    const gAfter = gAct();
    ok('底条被 transform 挪开时量的那一次不留错值：挪开/中途/落定三个时刻都还是布局占用（R116）',
        Math.abs(gDuring.act - gRest) <= 1 && Math.abs(gMid - gRest) <= 1 && Math.abs(gAfter - gRest) <= 1,
        `应为=${gRest}｜挪开时(tf=${gDuring.tf})=${gDuring.act} 中途=${gMid} 落定=${gAfter}`
        + `（改前实测：77 / 85 / 85 —— 落定后那个 85 就是没人补量的残留）`);
    // 间隙本身按**布局盒**算，不按 rect：这块面板收起态自己挂着 `translateY(-8px) scale(.98)`，
    // 打开要 200ms 滑到位 —— 用 rect 量，在 AVD ~3fps 下「连续两次读数相同」根本不代表落定
    // （本轮就是这么量出 25.4px 的假红）。布局盒和 CSS 用的是同一套算术，与动画无关。
    const gHr = document.querySelector('.header-right');
    gHr?.classList.add('active');
    const gPanel = document.querySelector('.header-collapsed .header-actions-group');
    await sleep(300);
    const gOpen = !!document.querySelector('.header-right.active');
    const gGap = gPanel ? (gBar.offsetTop - (gPanel.offsetTop + gPanel.offsetHeight)) : NaN;
    ok('⋮ 面板与底条之间是声明的 12px 间隙，不压不重叠（R116）',
        gOpen && gGap >= 11 && gGap <= 13,
        `间隙=${gGap}px（面板布局底=${gPanel ? gPanel.offsetTop + gPanel.offsetHeight : '-'} 底条布局顶=${gBar.offsetTop}）`
        + ` 面板开着=${gOpen ? '是' : '否'} cssBottom=${gPanel ? prop(gPanel, 'bottom') : '-'}`);
    gHr?.classList.remove('active');

    // ---- 1b‴. R117 A3/A2 · 两块浮在同一条底条上的面，和两种「菜单行」 ---------------------------
    // A3：面板 12px、长按菜单 8px，两个各写一次的数收成一条 `--float-gap`。
    // A2：面板行 12.48、菜单行 14.72，同一个角色两个字号。并档只能**往下并或往上并**，
    //     而往上并在横屏会挤掉 7 条（实测），所以竖屏两边都到 `--fs-body`、横屏面板留在 0.78rem。
    const fTok = (getComputedStyle(document.documentElement).getPropertyValue('--float-gap') || '').trim();
    const fMenu = document.querySelector('.card-context-menu');
    const fHr = document.querySelector('.header-right');
    fHr?.classList.add('active');
    fMenu?.classList.add('show');
    document.body.classList.add('context-open');
    await sleep(400);
    const fMenuGap = fMenu ? (gBar.offsetTop - (fMenu.offsetTop + fMenu.offsetHeight)) : NaN;
    ok('长按菜单与 ⋮ 面板离底条是同一个间隙（R117 A3：都走 --float-gap）',
        fTok === '12px' && Math.abs(fMenuGap - gGap) <= 1 && gGap >= 11 && gGap <= 13,
        `--float-gap=${fTok || '未定义'} 面板=${gGap}px 菜单=${fMenuGap}px`
        + `（菜单 cssBottom=${fMenu ? prop(fMenu, 'bottom') : '-'} 布局底=${fMenu ? fMenu.offsetTop + fMenu.offsetHeight : '-'}）`);
    const fMenuRow = fMenu ? [...fMenu.querySelectorAll('.context-item')].find((b) => getComputedStyle(b).display !== 'none') : null;
    const fMenuText = fMenuRow ? [...fMenuRow.children].find((c) => !c.classList.contains('context-icon')) : null;
    const fPanelText = document.querySelector('.header-collapsed .header-actions-group button .btn-text');
    const fsBody = (getComputedStyle(document.documentElement).getPropertyValue('--fs-body') || '').trim();
    ok('两处「菜单行」在竖屏是同一档字号 =--fs-body（R117 A2）',
        fMenuText && fPanelText
        && Math.abs(parseFloat(getComputedStyle(fMenuText).fontSize) - parseFloat(fsBody) * 16) < 0.2
        && Math.abs(parseFloat(getComputedStyle(fPanelText).fontSize) - parseFloat(fsBody) * 16) < 0.2,
        `面板=${fPanelText ? px1(getComputedStyle(fPanelText).fontSize) : '-'} 菜单=${fMenuText ? px1(getComputedStyle(fMenuText).fontSize) : '-'} --fs-body=${fsBody}`);
    // 并档的代价必须被看着：字号变大以后不许有行被挤掉。Range 实宽 vs 行内容盒右沿（R99 口径）。
    const clippedRows = [];
    for (const [name, root, sel] of [['⋮ 面板', gPanel, '.btn-text'], ['长按菜单', fMenu, '.context-item > span:not(.context-icon)']]) {
        if (!root) { clippedRows.push(`${name} 不在`); continue; }
        for (const row of root.querySelectorAll(sel)) {
            const host = row.closest('button, a') || row.parentElement;
            // 桌面残留行在手机上 `display:none`（实测「切换主题」「GitHub」两行 0×0）。
            // 零盒没有「挤掉」可言，而且 paddingRight 会让 room 变成负数 → 假红。
            if (!host || getComputedStyle(host).display === 'none' || host.getBoundingClientRect().width < 1) continue;
            const rg = document.createRange(); rg.selectNodeContents(row);
            const need = rg.getBoundingClientRect().width;
            const got = row.getBoundingClientRect().width;
            const rowCs = getComputedStyle(host);
            const room = host.getBoundingClientRect().right - parseFloat(rowCs.paddingRight);
            if (need > got + 0.5 || row.getBoundingClientRect().right > room + 0.5
                || host.scrollWidth > host.clientWidth + 1) {
                clippedRows.push(`${name}「${(row.textContent || '').trim().slice(0, 8)}」墨${Math.round(need * 10) / 10}>盒${Math.round(got * 10) / 10}`);
            }
        }
    }
    ok('并档之后没有一行被挤掉（竖屏两面逐行量）', clippedRows.length === 0,
        clippedRows.slice(0, 5).join(' | ') || `面板 ${(gPanel ? gPanel.querySelectorAll('.btn-text').length : 0)}`
        + ` + 菜单 ${(fMenu ? fMenu.querySelectorAll('.context-item').length : 0)} 行全部整字`);
    fHr?.classList.remove('active');
    fMenu?.classList.remove('show');
    document.body.classList.remove('context-open');
    await sleep(300);

    // ---- 1b⁗. R118 · 抽屉「事件类型」改成四段直选 ------------------------------------------------
    // 这行的验收不看「JS 里有没有值」，只看屏幕上有没有字：段的 `flex`/`min-height` 若被文档里
    // 更后的规则按住，computed style 当场露出来（R115 的 × 就是这么逮的）。段宽一律 Range 实量，
    // 而且基准自证：抽屉没开 / 段没盒 = 明说不判，不写成绿（R115 两条「要样本」的口径）。
    const tsRow = document.getElementById('eventTypeSegments');
    const tsSel = document.getElementById('eventFilter');
    const tsBar = document.querySelector('.sidebar');
    const tsHadFilters = tsBar ? tsBar.classList.contains('filters-open') : true;
    if (!tsBar.classList.contains('collapsed')) { /* 已开 */ } else { v.toggleSidebar(true); await sleep(600); }
    if (!tsHadFilters) tsBar.classList.add('filters-open');
    await sleep(200);
    const tsSegs = tsRow ? [...tsRow.querySelectorAll('.choice-segment')] : [];
    const tsTrack = tsRow ? tsRow.getBoundingClientRect() : null;
    const tsInk = (el) => { const r = document.createRange(); r.selectNodeContents(el);
        const w = r.getBoundingClientRect().width; r.detach && r.detach(); return Math.round(w * 10) / 10; };
    const tsRoom = (el) => { const c = getComputedStyle(el);
        return Math.round((el.getBoundingClientRect().width
            - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight)) * 10) / 10; };
    ok('抽屉开起来了且这一段真的有盒（基准自证，R118）',
        !!tsTrack && tsTrack.width > 40 && tsTrack.height > 20,
        `row=${tsTrack ? Math.round(tsTrack.width * 10) / 10 + '×' + Math.round(tsTrack.height * 10) / 10 : 'ABSENT'}`);
    ok('四段齐了，值与 <select> 的四个 option 一一对上（R118）',
        tsSegs.length === 4 && tsSel
        && [...tsSel.options].map(o => o.value).join('|') === tsSegs.map(s => s.dataset.mode).join('|'),
        tsSegs.map(s => `'${(s.textContent || '').trim()}'=${s.dataset.mode || '∅'}`).join(' '));
    ok('<select> 让位了：触摸端它自己不在屏上，轨道在（R118）',
        tsSel && tsRow
        && getComputedStyle(tsSel).display === 'none' && getComputedStyle(tsRow).display === 'flex',
        `select=${tsSel ? getComputedStyle(tsSel).display : '-'} row=${tsRow ? getComputedStyle(tsRow).display : '-'}`);
    const tsFlex = tsSegs.map(s => getComputedStyle(s).flex);
    const tsH = tsSegs.map(s => Math.round(s.getBoundingClientRect().height * 10) / 10);
    const tsMinTap = 40 - 0.5 / devicePixelRatio;      // 盒子按设备像素对齐（R102）
    ok('段真的等分且够点（flex 1 1 0，高 ≥40dp 容差后）（R118）',
        tsSegs.length === 4 && tsFlex.every(f => /^1 1 0px$/.test(f)) && tsH.every(h => h >= tsMinTap),
        `flex=${[...new Set(tsFlex)].join(',')} 高=${[...new Set(tsH)].join(',')}（下限 ${Math.round(tsMinTap * 100) / 100}）`);
    const tsClipped = tsSegs.filter(s => tsInk(s) > tsRoom(s) + 0.5
        || s.scrollWidth > s.clientWidth + 1);
    // 1.2.198 的截图才看出来：⋮ 面板那套段是靠 `border: none !important` 摘掉浏览器默认框的，
    // 抽屉这套没抄 → 每个未选段顶着一圈 1.85px outset 灰边，而 computed flex/高度/字号全绿。
    // 判据必须自己会抓这件事，否则下一轮还会从截图里长回来。
    const tsBorder = tsSegs.map(s => { const c = getComputedStyle(s);
        return { w: Math.max(parseFloat(c.borderTopWidth), parseFloat(c.borderLeftWidth)),
            ap: c.webkitAppearance || c.appearance || 'auto' }; });
    ok('段没有浏览器默认按钮框（border=0 且 appearance 已摘）（R118 截图逮到的）',
        tsSegs.length === 4 && tsBorder.every(b => b.w === 0)
        && tsBorder.every(b => b.ap === 'none'),
        `框宽=${[...new Set(tsBorder.map(b => b.w))].join(',')} appearance=${[...new Set(tsBorder.map(b => b.ap))].join(',')}`);    ok('每一段的字都整字放得下（Range 实宽 vs 段内容宽）（R118）',
        tsSegs.length === 4 && tsClipped.length === 0,
        tsClipped.length ? tsClipped.map(s => `'${(s.textContent || '').trim()}' 墨${tsInk(s)}>盒${tsRoom(s)}`).join(' ')
            : tsSegs.map(s => `${tsInk(s)}/${tsRoom(s)}`).join(' '));
    const tsActive = tsSegs.filter(s => s.classList.contains('on'));
    const tsChecked = tsSegs.filter(s => s.getAttribute('aria-checked') === 'true');
    // 不假定进来时是「全部」：前面几节可能已经动过筛选（R95 那条老口径）。判的是「亮的这一段
    // 正好等于 select 现在的值」，什么值都行。
    const tsExpect = tsSel ? tsSel.value : null;
    ok('只有一段亮着，而且亮的正是 select 现在那个值；aria-checked 跟着颜色走（R118）',
        tsActive.length === 1 && tsChecked.length === 1 && tsActive[0] === tsChecked[0]
        && tsActive[0].dataset.mode === tsExpect,
        `亮=${tsActive.length} checked=${tsChecked.length} select=${tsExpect === '' ? '∅(全部)' : tsExpect}`
        + ` 亮段=${tsActive[0] ? (tsActive[0].dataset.mode || '∅') : '-'}`);
    // 墨要读得出来：未选段用轨道底色，选中段用品牌紫。用 APP 自己的 contrastRatio，
    // 别手写线性亮度（R114：那条公式对饱和蓝低估一半，差点把结论判反）。
    // 深色主题这一层轨道是 `rgba(255,255,255,.1)`，拿它的原始 rgb 当底色 = 当成白底，
    // 于是浅色 13.59:1、深色 1.25:1 一栏绿一栏假红（R102 那条「合成底色不能假定是白」的翻版）。
    // 所以要沿祖先链把半透明一层层压到不透明为止。
    const tsNums = (s) => (String(s).match(/[\d.]+/g) || []).map(Number);
    const overBg = (el) => {
        let acc = null;
        for (let n = el; n && !(acc && acc[3] >= 0.999); n = n.parentElement) {
            const c = tsNums(getComputedStyle(n).backgroundColor || '');
            if (c.length < 3) continue;
            const a = c.length > 3 ? c[3] : 1;
            if (a <= 0) continue;
            acc = acc ? [0, 1, 2].map(k => c[k] * a + acc[k] * (1 - a)).concat([Math.min(1, a + acc[3] * (1 - a))])
                : [c[0], c[1], c[2], a];
        }
        return acc ? acc.slice(0, 3).map(Math.round) : null;
    };
    const tsPair = (a, b) => (typeof contrastRatio === 'function' && typeof parseInk === 'function' && b)
        ? Math.round(contrastRatio(parseInk(a), b) * 100) / 100 : '-';
    const tsOffInk = tsSegs.find(s => !s.classList.contains('on'));
    const tsOnSeg = tsActive[0];
    const tsTrackCs = tsRow ? getComputedStyle(tsRow) : null;
    const tsC1 = tsOffInk ? tsPair(getComputedStyle(tsOffInk).color, overBg(tsRow)) : '-';
    const tsC2 = tsOnSeg ? tsPair('rgb(255,255,255)', overBg(tsOnSeg)) : '-';
    ok('段上两种字色都过 AA（未选=轨底逐层合成，选中=品牌紫）（R118）',
        typeof tsC1 === 'number' && tsC1 >= 4.5 && typeof tsC2 === 'number' && tsC2 >= 4.5,
        `未选=${tsC1}:1 选中=${tsC2}:1（轨底合成=${overBg(tsRow)} 亮底合成=${tsOnSeg ? overBg(tsOnSeg) : '-'} 轨原始=${tsTrackCs ? tsTrackCs.backgroundColor : '-'}）`);
    // 点一段 → select 值、亮段、屏幕上的卡片三样必须一起动。卡片数是硬账：这目录里
    // SavedClips 6 / SentryClips 2 / RecentClips 1，筛完就该只剩 2 张。
    // 上一版这里读的是 `#fileList .event-group`（这个 app 的列表根本没有这个类）→ 前后都 0，
    // 那条判据等于没判：列表换成空壳也会绿。
    const tsCards = () => document.querySelectorAll('#fileList .video-card').length;
    const tsWanted = (mode) => (v.eventGroups || []).filter(e => !mode || e.eventType === mode).length;
    // The card-count account below compares "before" with the number of Sentry rows, so it needs
    // an unfiltered list. A previous section (or the fixture hand-off) may have left a filter on;
    // clear it rather than assuming the suite started clean.
    if (v.hasActiveFilters()) { v.clearFilters(); await sleep(350); }
    const tsBefore = tsCards();
    const tsTarget = tsSegs.find(s => s.dataset.mode === 'SentryClips');
    tsTarget?.click();
    await sleep(500);
    ok('点「哨兵」那一段：select 跟上、亮段跟上、aria 跟上（R118）',
        tsSel.value === 'SentryClips' && tsTarget.classList.contains('on')
        && tsTarget.getAttribute('aria-checked') === 'true' && v.hasActiveFilters(),
        `select=${tsSel.value} 亮=${tsSegs.filter(s => s.classList.contains('on')).length} 段=${(tsTarget.textContent || '').trim()}`);
    const tsNeed = tsWanted('SentryClips');
    // The list renders a page at a time (R41-10), so "cards in the DOM" only equals the filtered
    // count once every page has been pulled in. On the small fixture the two were the same number
    // and this criterion silently became a 60-row ceiling check.
    const drain = async () => {
        const list = v.dom.fileList;
        let last = -1;
        for (let i = 0; i < 60; i += 1) {
            const now = tsCards();
            if (now === last) break;
            last = now;
            list.scrollTop = list.scrollHeight;
            await sleep(120);
        }
        list.scrollTop = 0;
        await sleep(120);
        return last;
    };
    const tsShown = await drain();
    ok('筛完屏幕上的卡片数 = 这目录里 SentryClips 的事件数（R118；没这种事件就明说不判）',
        tsNeed === 0 ? true : (tsShown === tsNeed && tsNeed < v.eventGroups.length),
        tsNeed === 0 ? `样本里没有 SentryClips 事件（共 ${v.eventGroups.length} 个），这条不判`
            : `${tsBefore}→${tsShown}（翻完所有分页），应有 ${tsNeed}（按 eventGroups 现算）`);
    // 反向那条也得走：清除筛选是直接改 select 的值、不发 change 事件的，
    // 亮段只能靠 filterAndRender 里那一次同步（R96/R101「没被走过的分支等于没验证过」）。
    v.clearFilters();
    await sleep(400);
    const tsAll = await drain();
    ok('clearFilters()（不发 change 事件那一条路）也把亮段和列表一起送回「全部」（R118）',
        tsSel.value === '' && tsSegs[0].classList.contains('on') && !v.hasActiveFilters()
        && tsAll === tsWanted(''),
        `select=${tsSel.value || '∅'} 第0段亮=${tsSegs[0].classList.contains('on')} aria=${tsSegs[0].getAttribute('aria-checked')} 卡片=${tsAll}/${tsWanted('')}`);
    // 英文那一套短文案也得放得下 —— 这不是「顺手」：四段直选上线以后英文是同一个控件。
    const tsLangWas = v.currentLanguage;
    v.setLanguage('en');
    await sleep(500);
    const tsEnClipped = tsSegs.filter(s => tsInk(s) > tsRoom(s) + 0.5);
    ok('切到英文：四段短文案换上了，而且没有一段被挤掉（R118）',
        tsEnClipped.length === 0 && tsSegs.every(s => /[A-Za-z]/.test(s.textContent || '')),
        tsSegs.map(s => `'${(s.textContent || '').trim()}' ${tsInk(s)}/${tsRoom(s)}`).join(' '));
    if (tsLangWas !== 'en') v.setLanguage(tsLangWas);
    await sleep(400);
    if (!tsHadFilters) tsBar.classList.remove('filters-open');
    out.r118 = { segs: tsSegs.map(s => ({ t: (s.textContent || '').trim(), mode: s.dataset.mode,
        ink: tsInk(s), room: tsRoom(s) })), track: tsTrack ? Math.round(tsTrack.width * 10) / 10 : null,
        lang: v.currentLanguage };

    // ---- 1b⁙. R119 · 关掉 ⋮ 面板那 200ms，抬层不能先跑 ------------------------------------------
    // 病因：抬层挂在 `.main-header:has(.header-right.active)`（1700），摘 .active 的**同一帧**就掉回
    // 50，而面板那边还有 0.2s 淡出没走完 —— 那 200ms 里 HUD(z=100) 与整个播放器 chrome 画在还看得见
    // 的面板之上（`devtools/r119-staticA.png` 是把淡出冻在 50% 拍的，一眼可见）。
    // 判据不碰动画时序（这台 AVD 采不到 200ms，R112 记过）：摘完类**同步**读一次计算值，
    // 再看淡出窗口过去之后有没有把抬层还回去。两个方向都得判，只判第一个等于把 bug 挪个地方。
    const zHeader = document.querySelector('.main-header');
    const zHr = document.getElementById('headerRight');
    const zHud = document.getElementById('metadataPanel');
    const zFade = (getComputedStyle(document.documentElement).getPropertyValue('--menu-fade') || '').trim();
    zHr.classList.add('active');
    await sleep(400);
    const zOpen = getComputedStyle(zHeader).zIndex;
    zHr.classList.remove('active');
    // `MutationObserver` 的回调是微任务 ⇒ **同步**读一定读不到（1.2.201 第一版判据就是这么红的）。
    // 要判的是「下一帧画出来之前抬层还在」，所以让出一个宏任务再读：这一拍之后浏览器才可能渲染。
    await sleep(0);
    const zJustAfter = getComputedStyle(zHeader).zIndex;
    const liftedJustAfter = zHeader.classList.contains('menu-lifted');
    const hudZ = getComputedStyle(zHud).zIndex;
    await sleep(700);
    const zSettled = getComputedStyle(zHeader).zIndex;
    const liftedSettled = zHeader.classList.contains('menu-lifted');
    ok('摘掉 .active 后、下一帧画出来之前抬层还在（淡出期间面板不被 HUD 穿，R119）',
        zOpen === '1700' && zJustAfter === '1700' && liftedJustAfter && parseInt(hudZ, 10) < 1700,
        `开=${zOpen} 摘后同帧=${zJustAfter}（menu-lifted=${liftedJustAfter}） HUD=${hudZ} --menu-fade=${zFade || '未定义'}`);
    ok('淡出窗口过后抬层要还回去（不许永久压在抽屉/数据板上）（R119）',
        zSettled === '50' && !liftedSettled, `700ms 后=${zSettled} menu-lifted=${liftedSettled}`);
    // 抬层必须由那条**不依赖 .active** 的规则承担：只挂在 `:has(.header-right.active)` 上
    // 就是原来的病；把类单独挂一次看它自己够不够 1700。
    zHeader.classList.add('menu-lifted');
    const zAlone = getComputedStyle(zHeader).zIndex;
    zHeader.classList.remove('menu-lifted');
    ok('`.menu-lifted` 单独就能抬到 1700（不是靠 .active 顺带）（R119）',
        zAlone === '1700' && getComputedStyle(zHeader).zIndex === '50',
        `只挂类=${zAlone} 摘回后=${getComputedStyle(zHeader).zIndex}`);

    // ---- 1b⁚. R120 · 一条色相，两个角色 -----------------------------------------------------------
    // 病因不是「谁挑错了紫」，是 CSS 自定义属性的替换发生在**声明它的那一级**：
    // `--cta-fill: var(--accent-solid)` 写在 `:root` 上，于是 R114 放在 `body:not(.dark-theme)` 里的
    // 浅色覆盖永远进不到 `--cta-fill` —— 同一屏上 `.choice-segment.on` 是 #2210c5、`.date-chip.is-active`
    // 仍是 #5b4bf0（`devtools/r120-blue-census.js` 量出来的）。R120 把「填充族」从主题覆盖里摘出去，
    // 「字色族」继续压暗（只有字色进求解器的 AA 约束）。判据全部走**探针**：不挑界面状态，
    // 因为日期 chip 有没有选中、抽屉开没开都不该让一条 token 判据变红或变绿。
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px';
    const readVar = (name, host) => {
        probe.style.background = `var(${name})`;
        host.appendChild(probe);
        const c = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return c;
    };
    const FILL_RGB = 'rgb(91, 75, 240)', TEXT_RGB = 'rgb(34, 16, 197)';
    const isDarkNow = document.body.classList.contains('dark-theme');
    const fillTok = readVar('--accent-solid', document.body);
    const ctaTok = readVar('--cta-fill', document.body);
    const accentTok = readVar('--accent', document.body);
    // 挂在 <html> 上读：拿的是 `:root` 那一份，不继承 body 上的任何主题覆盖 —— 这一条证明
    // 「桌面一字未改」：填充族现在两个主题、两个 shell 都只有 #5b4bf0 这一档。
    const fillAtRoot = readVar('--accent-solid', document.documentElement);
    ok('填充族只剩一档：`--accent-solid` 与 `--cta-fill` 在 body 上解析到同一个值（R120）',
        fillTok === ctaTok && fillTok === FILL_RGB,
        `--accent-solid=${fillTok} --cta-fill=${ctaTok}`);
    ok('`--accent-solid` 不再被任何主题覆盖（html 与 body 读到同一个值）（R120）',
        fillAtRoot === fillTok, `html 上=${fillAtRoot} body 上=${fillTok}`);
    if (isDarkNow) {
        ok('深色主题的字色族没被一起改动（R120）', accentTok === 'rgb(185, 174, 255)',
            `--accent=${accentTok}（深色那档应为 #b9aeff）`);
    } else {
        ok('浅色主题的字色族继续压暗在 #2210c5（R114 的成果没退）（R120）',
            accentTok === TEXT_RGB, `--accent=${accentTok}`);
    }
    // 底部条激活标签是「把同一个值当字画」的那一处：它以前读 `--bg-button`（填充族），R120 改读
    // `--accent`。这条判据就是那一次改动本身 —— 它要是退回去，白玻璃在暗素材上会被要价 .881。
    const onTab = document.querySelector('.phone-action-bar .tab-btn.on');
    if (onTab) {
        const tabCol = getComputedStyle(onTab).color;
        ok('底部条激活标签的字色走字色族，不跟着填充族变浅（R120）',
            tabCol === accentTok && tabCol !== FILL_RGB, `实测=${tabCol} 字色族=${accentTok}`);
    } else {
        out.r120Tab = 'n/a —— 这一拍没有 `.tab-btn.on`，不判';
    }
    // 这条才是真正守得住「不许退回白板」的那一道：⋮ 面板的墨集合里**一支都不许是浅紫**。
    // 为什么不能只看 token 的解析值 —— `--accent: var(--glass-tint)` 声明在 `:root` 上，替换发生在
    // html，`body:not(.dark-theme)` 里那份 #2210c5 根本进不去（抽屉的「完成」实测就是 #5b4bf0，
    // `devtools/r120-blue-census.js`）。所以判据必须落在**元素实渲的 color** 上，不是 token 上。
    const bp = document.getElementById('headerActionsGroup') || document.querySelector('.header-right .header-actions-group');
    const leaks = bp ? [...bp.querySelectorAll('*')]
        .filter(n => n.textContent && n.textContent.trim() && getComputedStyle(n).color === FILL_RGB)
        .map(n => (n.className || n.tagName) + ' «' + n.textContent.trim().slice(0, 8) + '»') : [];
    ok('⋮ 面板里没有任何「字」画在浅紫那一档（这一支要材质 .881，就是白板）（R120）',
        !!bp && leaks.length === 0,
        bp ? `浅紫字色=${leaks.length}${leaks.length ? ' → ' + leaks.slice(0, 3).join(' ; ') : ''}` : '面板元素缺失');
    // 求解器现在自己报「谁钉厚的」。这条不假定值（AVD 的录像和真机不是一批帧），只守两件事：
    // 字段得在、类型得对，并且**品牌紫不能再当钉厚的那一支**（那正是 R114 关掉、R120 又不许退回去的）。
    const gstate = typeof glassState === 'undefined' ? null : glassState;
    const bindG = gstate && gstate.binding && gstate.binding.glass;
    if (gstate && gstate.solved && bindG) {
        ok('钉住白玻璃的那支墨不再是品牌紫（R120）',
            bindG.indexOf('91,75,240') !== 0, `bind=${bindG}`);
    } else {
        out.r120Bind = gstate ? `n/a —— solved=${gstate.solved} bind=${bindG || '空'}，未解过就不判` : 'n/a —— 页面里没有 glassState，不判';
    }
    ok('诊断要能报出「谁钉厚的」与「此刻几支墨不过 AA」（R120 新增字段）',
        !!gstate && gstate.binding && typeof gstate.binding.glass === 'string'
        && typeof gstate.subAa === 'number' && typeof gstate.subAaWorst === 'number',
        `bind=${bindG || '-'} subAa=${gstate ? gstate.subAa : '?'}/${gstate ? gstate.subAaWorst : '?'}`);

    // ---- 1b⁛. R121 · B 方案落地：压在玻璃上的次要灰压深一档 --------------------------------------
    // 真机 1.2.202 自己报的凶手：`bind=108,117,125~0.92@⋮面板`、`subAa=3/worst=1.04`。
    // 这一节判的不是「颜色改了没有」，而是**改完之后这套材质还需要多厚** —— 那才是用户报的那件事。
    const GRAY_OLD = 'rgb(108, 117, 125)', GRAY_NEW = 'rgb(68, 69, 73)';
    const divEl = document.querySelector('.header-collapsed .header-actions-group .menu-divider')
        || document.querySelector('.menu-divider');
    const divCol = divEl ? getComputedStyle(divEl).color : 'n/a';
    if (isDarkNow) {
        ok('深色主题没被 B 越界（分组标题继续用 --text-secondary）（R121）',
            divCol !== GRAY_NEW, `深色下实测=${divCol}`);
    } else {
        ok('压在玻璃上的分组标题灰已到 #444549（R121 · B）',
            divCol === GRAY_NEW, `实测=${divCol}`);
    }
    // 越界检查：次要灰全站 39 处在**实底面板**上（日期 chip / 最近目录 chip / 视频副标题…），
    // B 说好了不动它们 —— 层次还要在。
    const chipEl = document.querySelector('.date-chip:not(.is-active)');
    if (chipEl) {
        ok('抽屉与弹层的次要灰维持原值（B 只改压在玻璃上的那几处）（R121）',
            isDarkNow || getComputedStyle(chipEl).color === GRAY_OLD,
            `.date-chip 实测=${getComputedStyle(chipEl).color}`);
    } else {
        out.r121Chip = 'n/a —— 这一拍没有未选中的 .date-chip，不判越界';
    }
    // 真正的目标：⋮ 面板**对着玻璃**的那些墨，在整段底色上扫一遍，最大需求必须 ≤.66，
    // 而且不许再有「任何厚度都救不了」的档（那档以前被 unsavable 静默踢掉 → 1.41:1 画在屏幕上）。
    // 注意不能直接拿 `solveGlassAlpha` 的返回值判 ≤.66：全 unsavable 时它就返回最薄档 .45，
    // 那是**假绿** —— 所以「有没有救不了」必须单独判。
    const bPanel = document.getElementById('headerActionsGroup')
        || document.querySelector('.header-collapsed .header-actions-group');
    const bFill = bPanel ? parseInk(getComputedStyle(bPanel).backgroundColor) : [];
    // `onGlassHere` / `BAND` 复用 ⑥′ 那一份（同一套判据只写一遍，两处交叉核对才有意义）。
    let bVerdict = null;
    if (bPanel && bFill.length === 3) {
        const seen = new Set();
        const inks = [];
        for (const n of [bPanel, ...bPanel.querySelectorAll('*')]) {
            if (!n.textContent || !n.textContent.trim()) continue;
            if (!onGlassHere(n, bPanel, bFill)) continue;
            const c = parseInk(getComputedStyle(n).color);
            if (c.length !== 3) continue;
            const k = c.join(',');
            if (seen.has(k)) continue;
            seen.add(k); inks.push(c);
        }
        let worst = 0, unsav = [];
        for (const L of [40, 70, 98, 130, 167, 197, 230, 255]) {
            const bd = [L, L, L];
            const cons = glassInkConstraints(bFill, bd, inks);
            unsav = unsav.concat(cons.unsavable.map((i) => `${i.join(',')}@${L}`));
            worst = Math.max(worst, solveGlassAlpha(bFill, bd, inks));
        }
        bVerdict = { inkCount: inks.length, worst: +worst.toFixed(3), unsav: unsav.slice(0, 4) };
        ok('浅色 ⋮ 面板对着玻璃的墨：全档底色最大需求 ≤.66 且没有「救不了」的档（R121 · B 的目标）',
            isDarkNow || (bVerdict.worst <= 0.66 && bVerdict.unsav.length === 0),
            `对着玻璃的墨=${bVerdict.inkCount} 种 最厚需求=${bVerdict.worst}`
            + ` 救不了的档=${bVerdict.unsav.length ? bVerdict.unsav.join(',') : '无'}`);
    } else {
        out.r121Panel = 'n/a —— ⋮ 面板或其底色读不到，不判厚度需求';
    }
    // `subAa` 的交叉核对：判据自己独立复算一遍（含「是否对着玻璃」那层分流），两边必须相等。
    // 不相等就说明诊断里的数含假阳性或漏算 —— 那比没有这个数更糟，因为它会被当成依据。
    if (gstate && gstate.solved && gstate.luma >= 0 && bPanel && bVerdict) {
        let mine = 0;
        for (const sel of LENS_SURFACES) {
            const host = document.querySelector(sel);
            if (!host) continue;
            // 和 app 里同一套：数据板用它自己那一组的 alpha，白玻璃用另一组（R107 的分家）。
            const a = sel === GLASS_PLATE_SURFACE ? gstate.plateAlpha : gstate.alpha;
            const fill = parseInk(getComputedStyle(host).backgroundColor);
            if (fill.length !== 3) continue;
            const bd = [gstate.luma, gstate.luma, gstate.luma];
            const done = new Set();
            for (const n of [host, ...host.querySelectorAll('*')]) {
                if (!n.textContent || !n.textContent.trim()) continue;
                const c = parseInk(getComputedStyle(n).color);
                if (c.length !== 3 || !onGlassHere(n, host, fill)) continue;
                const k = c.join(',');
                if (done.has(k)) continue;
                done.add(k);
                if (contrastRatio([0, 1, 2].map((x) => fill[x] * a + bd[x] * (1 - a)), c) < 4.5) mine += 1;
            }
        }
        ok('诊断里的 subAa 与判据独立复算的支数一致（假阳性/漏算都会在这里露出来）（R121）',
            mine === gstate.subAa, `独立复算=${mine} 诊断报=${gstate.subAa}`
            + `（玻璃 alpha=${gstate.alpha} 板=${gstate.plateAlpha} 底=${gstate.luma}）`);
    }
    if (bindG) {
        ok('钉厚的那一支已经不是那支中灰了（R121）',
            isDarkNow || bindG.indexOf('108,117,125') !== 0, `bind=${bindG}`);
    }

    // ---- 1b⁜. R122 · 换主题不许骑在退档斜坡上 ---------------------------------------------------
    // 真机 1.2.203：切到浅色后 `alpha=.80 want=.45 rel=1`，实测 12.6 秒还停在 .681 —— 那十几秒
    // 用户看到的就是一块白板。根因不是需求错（want 已经对了），是退档一次只走 .04。修法两条：
    // ① `applyTheme` 里把解算器复位成「第一次解」（下一拍直接落位）；② 退档步长跟差距走。
    // 判据判的是**用户能看见的那件事**：切过去 1.2 秒之后，写上去的 alpha 必须已经等于需求。
    // R124 · 材质改成**固定档**（用户定案：不要自适应玻璃）。判据随之改成「写上去的那个值」：
    // 切过去就是该主题那一档，切回来也是 —— 没有斜坡、没有 wishy-washy 的中间值。
    const themeWasDark = document.body.classList.contains('dark-theme');
    const themeBtn = (m) => document.querySelector(`#themeChoice [data-mode="${m}"]`);
    const paintedAlpha = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lens-alpha')) || 0;
    const FIXED = { light: 0.88, dark: 0.90 };
    if (themeBtn('light') && themeBtn('dark')) {
        themeBtn(themeWasDark ? 'light' : 'dark').click();
        await sleep(700);
        const otherSide = { theme: themeWasDark ? 'light' : 'dark', a: +paintedAlpha().toFixed(3) };
        themeBtn(themeWasDark ? 'dark' : 'light').click();
        await sleep(700);
        const backSide = { theme: themeWasDark ? 'dark' : 'light', a: +paintedAlpha().toFixed(3) };
        ok('材质是固定档：切主题后立刻就是该主题那一档（R124）',
            Math.abs(otherSide.a - FIXED[otherSide.theme]) < 0.006
            && Math.abs(backSide.a - FIXED[backSide.theme]) < 0.006,
            `切到 ${otherSide.theme} 写上去=${otherSide.a}（应 ${FIXED[otherSide.theme]}）`
            + `｜切回 ${backSide.theme} 写上去=${backSide.a}（应 ${FIXED[backSide.theme]}）`);
        // 再守一遍「它真的不动」：同一个主题里连读三次，必须一个数。
        const a1 = paintedAlpha(); await sleep(900); const a2 = paintedAlpha(); await sleep(900); const a3 = paintedAlpha();
        ok('材质在自己主题里不再随画面变（连读三次同一个数）（R124）',
            a1 === a2 && a2 === a3, `${a1} / ${a2} / ${a3}`);
        document.body.classList.toggle('dark-theme', themeWasDark);
    } else {
        out.r122Theme = 'n/a —— 找不到 #themeChoice 的浅色/深色按钮，不判';
    }
    // R122 第二版：用户说「『复制诊断』后面没有选项」—— 占满整行他仍然读成空一格，于是把
    // 「关于」提上来配对（DOM 顺序改在 index.html）。判据改成「两条在同一行、左右各一格」，
    // 而且「其他」里不许再出现落单的控件（落单 = 右边空一格，那正是用户第二次报的东西）。
    // R124 · 用户：「设置里面的『关于』一般都是放到最后面的」。判据跟着改成现在的设计：
    // 关于必须是同组最后一个控件、且独占整行；复制诊断则和「手势说明」并排（不再空半格）。
    const diagBtn = document.getElementById('diagnosticsBtn'), aboutBtn = document.getElementById('aboutBtn');
    const gestBtn = document.getElementById('gestureHelpBtn');
    if (diagBtn && aboutBtn && gestBtn && innerHeight > innerWidth) {
        const sibs = [...diagBtn.parentElement.children].filter((n) => n.classList.contains('control-btn')
            && getComputedStyle(n).display !== 'none');
        const dr = diagBtn.getBoundingClientRect(), gr = gestBtn.getBoundingClientRect(), ar = aboutBtn.getBoundingClientRect();
        const sameRow = Math.abs(dr.top - gr.top) < 2 && gr.left > dr.right - 2;
        const lastOne = sibs[sibs.length - 1] === aboutBtn;
        ok('关于是「其他」里最后一个、且独占一行；复制诊断与手势说明并排（R124）',
            sameRow && lastOne && Math.abs(ar.top - gr.top) > 2,
            `复制诊断|手势说明 同行=${sameRow}｜关于最后=${lastOne} 宽=${Math.round(ar.width)}`);
    } else {
        out.r124Pair = 'n/a —— 缺按钮或不是竖屏，不判';
    }
    // 玻璃那层模糊：用户说「可视性不如白板」，16 → 24 是这一轮的答复。
    const lensRule = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
        .filter((r) => r.cssText && r.cssText.includes('backdrop-filter') && r.cssText.includes('tesseraLens'));
    ok('压在画面上的那几面玻璃用 24px 模糊（可视性：把背后的形状糊成色块）（R122）',
        lensRule.some((r) => /blur\(24px\)/.test(r.cssText)), `命中规则=${lensRule.length} 条`);

    // ---- 1c. 透度是每帧解出来的，不是常数 ---------------------------------------------------------
    // 判据不看 alpha 落在哪个区间（那是自嗨），而是拿运行时自己报的实测底色，把「合成后的底 vs 三个面
    // 的真实墨色」重算一遍对比度：必须仍然 ≥4.5。底色有两个来源（glassState.src）：在播的那一帧，或
    // 没有视频时 CSS 自己画的那层页面底 —— 两条都是量出来的，只有都量不到（src=none）才允许跳过。
    const alphaRaw = getComputedStyle(document.documentElement).getPropertyValue('--lens-alpha').trim();
    const la = parseFloat(alphaRaw);
    const gs = (typeof glassState === 'object' && glassState) ? glassState : { luma: -1, src: 'none', unsavable: -1 };
    const gLuma = gs.luma;
    if (!(gLuma > 0)) {
        // 黑帧不是「量到的底色」：解码器没交纹理时整帧是 0，拿它算对比度会得到一条很好看的假绿。
        // R113 改判据：这一支的规则从「不许比兜底更透」换成了**「量不到就不许动材质」**。前一条放过了
        // 反方向的错（一次落空把合法的 .45 立刻推到 .72 = 真机那句「先半透明、很快变白底」），
        // 所以这里判两件事：① 变量与 glassState 必须一致（没有谁被悄悄摘掉回落到 CSS）；
        // ② 台账里一条 `no-src` 写入都不许有（那一支现在只记录 luma=-1，不写材质）。
        ok('自适应透度：底色不可测那一拍什么都不动（变量=状态 且台账里没有 no-src 写入）',
            Math.abs(la - gs.alpha) <= 0.005
            && !(typeof glassLedger === 'object' && glassLedger.filter((e) => e.why === 'no-src').length),
            `src=${gs.src} luma=${gLuma} --lens-alpha=${alphaRaw || '未设置'} glassState.alpha=${gs.alpha}`
            + ` no-src写入=${(typeof glassLedger === 'object' ? glassLedger.filter((e) => e.why === 'no-src').length : '无台账')}`);
        ok('黑帧不会被当成量到的底色（src 不能是 video 而 luma=0）',
            !(gs.src === 'video' && gLuma === 0), `src=${gs.src} luma=${gLuma}`);
    } else {
        // 逐面判，且判的是**这一面最终画出来的那个 alpha**（从 computed backgroundColor 里读第 4 个数），
        // 不是整档的 --lens-alpha。R103 自查抓出来的假绿：行车数据卡片在 CSS 里写的是
        // `calc(var(--lens-alpha) - 0.1)`，而上一版判据拿底部条的填充色 + 整档 alpha 替所有面算对比度 ——
        // 那张卡上的字从来没被这道保证真正覆盖过。
        const parse4 = (s) => { const m = (s.match(/[\d.]+/g) || []).map(Number); return { c: m.slice(0, 3), a: m.length >= 4 ? m[3] : 1 }; };
        const inksOf = (el) => {
            const set = new Set();
            for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
                if (!n.textContent || !n.textContent.trim()) continue;
                const s = getComputedStyle(n);
                if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
                const c = ((s.color).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
                if (c.length === 3) set.add(c.join(','));
            }
            return [...set];
        };
        // R107：运行时求解时**不看暂时可见性**（收起的 ⋮ 面板也要被保护），所以「重算一遍需求」这条
        // 判据必须用同一套收集规则，否则判据永远比运行时少几种墨 —— 又会变成两边各自都绿。
        // `inksOf` 留给「此刻屏幕上的字读不读得清」那条用，那个问的就是当下。
        const inksOfAll = (el) => {
            const set = new Set();
            for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
                if (!n.textContent || !n.textContent.trim()) continue;
                const s = getComputedStyle(n);
                if (s.display === 'none') continue;
                const c = ((s.color).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
                if (c.length === 3) set.add(c.join(','));
                if (set.size >= 12) break;
            }
            return [...set];
        };
        // R187 · 与产品同一口径：自己压在不透明小药丸上的字不参与「透过玻璃读」的账。
        // 少了这一条，危险行改成浅红药丸 + 深红字之后，判据会在暗画面上红在一条贴不到玻璃的墨上。
        const onGlassInks = (el, fill) => {
            const out = new Set();
            for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
                if (!n.textContent || !n.textContent.trim()) continue;
                const st = getComputedStyle(n);
                if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
                const c = ((st.color).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
                if (c.length !== 3) continue;
                let pill = false;
                for (let q = n; q && q !== el; q = q.parentElement) {
                    const bg = getComputedStyle(q).backgroundColor;
                    const v = (bg.match(/[\d.]+/g) || []).map(Number);
                    if (v.length < 3) continue;
                    const al = v.length >= 4 ? v[3] : 1;
                    if (al > 0.5 && v.slice(0, 3).some((x, i) => Math.abs(x - fill[i]) > 12)) { pill = true; break; }
                }
                if (!pill) out.add(c.join(','));
            }
            return [...out];
        };
        const crAt = (fill, a, ink) => ratio([0, 1, 2].map((k) => fill[k] * a + gLuma * (1 - a)), ink);
        const rows = [];
        for (const [name, sel] of Object.entries(SURFACES)) {
            const el = document.querySelector(sel);
            if (!el) continue;
            const { c: fill, a: sa } = parse4(getComputedStyle(el).backgroundColor);
            if (fill.length !== 3) continue;
            for (const key of onGlassInks(el, fill)) {
                const ink = key.split(',').map(Number);
                // 「加厚能不能救」在这一面自己的 alpha 空间两端各试一次（.30~1.00 比整档区间还宽，
                // 覆盖任何 CSS 侧的偏移）。两端都不过的是 token 自己的账，不该把材质钉死在实心。
                // 「救得了」必须按**运行时的同一个窗口**判：[GLASS_ALPHA_MIN, GLASS_ALPHA_MAX]。
                // 原来这里取 sa±0.4 并允许到 1.0，于是「只有把材质做成完全不透明才过」的墨色被算成
                // 救得了（运行时把它归到 unsavable）—— 两边窗口不一致，判据就会红在一条本来就不该
                // 由材质负责的墨上（本轮 ⋮ 面板的 rgb(108,117,125) 就是这么抓出来的）。
                const savable = crAt(fill, GLASS_ALPHA_MAX, ink) >= 4.5 || crAt(fill, GLASS_ALPHA_MIN, ink) >= 4.5;
                rows.push({ name, key, sa, cr: +crAt(fill, sa, ink).toFixed(2), savable });
            }
        }
        const bound = rows.filter((r) => r.savable);
        const stuck = rows.filter((r) => !r.savable);
        const worst = bound.slice().sort((a, b) => a.cr - b.cr)[0] || { name: '-', key: '-', cr: 99, sa: la };
        ok(`自适应透度仍然过 AA（逐面按各自最终 alpha 判，对${gs.src}实测底色）`, worst.cr >= 4.5,
            `src=${gs.src} 底色亮度=${gLuma} 整档alpha=${la} 受约束${bound.length}条 最差=${worst.name} rgb(${worst.key})@${worst.sa.toFixed(2)} ${worst.cr}:1`);
        ok('「加厚也救不了的墨色」单独报出，不参与 AA 判定也不钉死材质',
            stuck.length === 0 || stuck.length <= rows.length / 2,
            `运行时 unsavableInk=${gs.unsavable}；验收侧 ${stuck.length}/${rows.length} 条` +
            (stuck.length ? `：${[...new Set(stuck.map((s) => `${s.name} rgb(${s.key})`))].join(' | ')}` : ''));
        // ---- R107：两组各解各的 —— 数据卡那一支蓝不许再钉住白玻璃 --------------------------------
        // 这条不是「数值对不对」而是「解耦有没有真的发生」：拿运行时同一个 solveGlassAlpha 把两组的
        // 需求各自重算一遍，再和运行时写进 CSS 的两个值比。共用一个变量的话，白玻璃那组会等于
        // max(白玻璃, 数据卡)，与它自己那组的需求差出 0.4 —— 正是用户看到的「玻璃像一块板」。
        const plateEl = document.querySelector('.metadata-panel');
        // 口径必须和运行时**取同一张清单**：`LENS_SURFACES`（script.js:1235），而且只按「在不在 DOM」筛。
        // 上一版这里用的是判据自己那份 SURFACES 再加 `display!==none`，少算了两个面（收起的长按菜单
        // `visibility:hidden` 不算 display:none，运行时照样为它解）—— 于是判据算出「应 .45」而运行时
        // 写的是 .88，红得像是解耦没生效。1.2.190 实测：菜单里那支系统红 `rgb(255,69,58)` 单独要 .842。
        const GLASS_LIST = ((typeof LENS_SURFACES === 'object' && LENS_SURFACES)
            ? [...LENS_SURFACES] : Object.values(SURFACES)).filter((s) => s !== GLASS_PLATE_SURFACE);
        const glassEls = GLASS_LIST.map((s) => document.querySelector(s)).filter(Boolean);
        const needAt = (lum, el) => {
            const { c: fill } = parse4(getComputedStyle(el).backgroundColor);
            const inks = inksOfAll(el);
            // 没有可见文字的面**没有约束可解**（空数据卡会算出 .45，而运行时刚才是按有数据的它解的）——
            // 这种半路空掉的样本必须跳过并说明，不能拿它当「实现不一致」。R101 记过同一类：空状态下的
            // 「没压到 / 够用」是没有内容的空话。
            if (fill.length !== 3 || !inks.length) return null;
            return solveGlassAlpha(fill, [lum, lum, lum], inks.map((k) => k.split(',').map(Number)));
        };
        // 底色每换一帧，两组的**需求**都要跟着重算（需求本身不该被迟滞影响，只有写出来的值会被拖着）。
        const needsAt = (lum) => {
            const ns = glassEls.map((el) => needAt(lum, el)).filter((x) => x !== null);
            return {
                count: ns.length,
                glass: ns.length ? Math.max(GLASS_ALPHA_MIN, ...ns) : null,
                // 数据卡只在**有数据**时才可比：运行时是照着有读数的它解出来的，判据若在半路空掉的卡上重算，
                // 会得到 .45 这种「没有墨要保护」的数 —— 那是量具在描述空状态（R101 记过）。
                plate: (plateEl && plateEl.classList.contains('has-data')) ? needAt(lum, plateEl) : null,
            };
        };
        // R109 之后这条不能直接拿「当下写出来的值」比：变薄要「低过死区 + 连续稳 4 秒 + 一次一档」，
        // 材质**故意**会比自己的需求厚一段时间。上一版为此起了一条「等它放下来，最多 60 秒」的轮询 ——
        // 那是把两条不同的性质塞进一条判据，代价实测很难看：AVD 一条片子只有 7~8 段 × 18 s，60 秒轮询
        // 跑完时预览早就空了，后面几条要样本的判据跟着一起红（本轮「退场判据有样本可测 = 0 个」
        // 「关掉无障碍开关后材质回得来 = 样本(无)」都是它带出来的）。
        // 改成**把迟滞旁路掉再比**：`solved=false` 是运行时本来就存在的状态（刚挂上材质、还没解过），
        // 那一拍 `ramp()` 原样返回 `need[g]`（script.js:1513），于是量到的就是求解器自己给两组的数 ——
        // 这正是本条要问的事。「收敛要多久、会不会来回抖」是另一条性质，由 r109-alpha-stability.js 判。
        // 旁路与恢复在同一个同步任务里做完（setInterval 抢不进来），结束后原值原样放回，不留残值。
        const SNAP = ['alpha', 'plateAlpha', 'luma', 'cells', 'target', 'plateTarget', 'src',
            'solved', 'unsavable', 'inks', 'lensLive', 'nextSolve', 'thinGlass', 'thinPlate',
            'peakGlass', 'peakPlate', 'releasingGlass', 'releasingPlate'];
        const snap = {};
        SNAP.forEach((k) => { snap[k] = gs[k]; });
        const lensMounted = document.documentElement.classList.contains('glass-lens')
            && !document.documentElement.classList.contains('solid-material') && !document.hidden;
        let dec = needsAt(gs.luma), how = '', aG = null, aP = null;
        if (snap.luma > 0 && lensMounted && typeof adaptGlassAlpha === 'function') {
            try {
                glassState.solved = false;
                glassState.thinGlass = 0; glassState.thinPlate = 0;
                glassState.nextSolve = 0;      // 越过 900ms 采样窗口，这一拍就解
                adaptGlassAlpha();
                // nextSolve 被推前**且底色没换** = 这一拍真的走进了求解分支（门槛任一没过、或采到别的帧
                // 都是空跑，不能当旁路成功）。
                if (glassState.nextSolve !== snap.nextSolve && glassState.luma === snap.luma) {
                    aG = glassState.alpha; aP = glassState.plateAlpha;
                    dec = needsAt(glassState.luma);
                    how = '旁路迟滞，当场比';
                }
            } finally {
                SNAP.forEach((k) => { glassState[k] = snap[k]; });
                // CSS 那两个变量也放回旁路前的值：未收敛的薄玻璃不该留在页面上给后面的判据看。
                document.documentElement.style.setProperty('--lens-alpha', snap.alpha.toFixed(3));
                document.documentElement.style.setProperty('--lens-alpha-plate', snap.plateAlpha.toFixed(3));
            }
        }
        if (aG === null) {
            // 旁路走不通（这一屏没挂材质 / 页面看不见 / 底色没量到）才退回等收敛，而且只等 12 秒 ——
            // 60 秒那种长度就是上面那场连带红的成因。
            let waited = 0;
            for (let i = 0; i < 12; i++) {
                dec = needsAt(gs.luma);
                aG = gs.alpha; aP = gs.plateAlpha;
                if (dec.glass === null || Math.abs(aG - dec.glass) <= 0.07) break;
                await sleep(1000); waited += 1;
            }
            how = `迟滞未旁路，等收敛 ${waited}s`;
        }
        ok(`透度分两组解：白玻璃按自己那组走，不被数据卡钉住（R107；${how}）`,
            dec.glass !== null && Math.abs(aG - dec.glass) <= 0.07
            && (dec.plate === null || Math.abs(aP - dec.plate) <= 0.07),
            `白玻璃组 实测${aG.toFixed(2)}/应${dec.glass.toFixed(2)}`
            + `（${dec.count} 个面）｜数据卡组 ${aP.toFixed(2)}`
            + `/应${dec.plate === null ? '跳过(无数据或无可见墨)' : dec.plate.toFixed(2)}`
            + (dec.plate !== null && dec.plate > dec.glass + 0.1
                ? `｜解耦生效：差 ${(dec.plate - dec.glass).toFixed(2)} 档，白玻璃没被拖厚` : ''));
        // 这条是本轮真正的回归判据：R103 之前守卫写反，暗底（AA 轻松过的那一档）解出 .92 = 一块板子。
        // 这对判据原来拿**底部条的填充色 + 浅色墨**算，等于假定自己是深色主题：浅色主题下底部条是白底，
        // 白底压浅墨在亮帧上本来就过 AA，`brightSolve > darkSolve` 就成了必然失败（本轮就是这么红的）。
        // 换成方向一定成立的那一组：深色数据板（两个主题都是它）+ 白读数 —— 亮底要更厚、暗底可以更薄。
        const plateFill = [12, 12, 16], plateInk = [[255, 255, 255]];
        const darkSolve = solveGlassAlpha(plateFill, [37, 37, 37], plateInk);
        ok('暗底上解出来的是「最薄能过 AA 的那一档」，不是最厚（守卫方向）', darkSolve <= 0.46,
            `深色板+白读数 底色37 → alpha=${darkSolve.toFixed(3)}（R103 修前=0.920）`);
        const brightSolve = solveGlassAlpha(plateFill, [253, 253, 253], plateInk);
        // 阈值只主张「方向」：亮底必须比暗底要得更厚。原来写死 +0.2 是照着一组特定墨色估的，
        // 换成深色板 + 白读数之后真实差就是 0.12 —— 判据不该比被测量更自信。
        ok('亮底上仍然会加厚到够 AA（不是单纯调透）', brightSolve > darkSolve + 0.05,
            `深色板+白读数 底色253 → alpha=${brightSolve.toFixed(3)}（暗底 ${darkSolve.toFixed(3)}）`);
        ok('采不到视频时底色改由 CSS 那层页面底量出（不再是写死的 .72）',
            gs.src !== 'none', `src=${gs.src} luma=${gLuma} alpha=${Number.isFinite(la) ? la : '未设置(回落 .72)'}`);
    }

    // R105 之后底部条多半不再挂滤镜（它背后是页面底不是画面），拿它当「减弱透明度前后有没有变化」的样本
    // 会得到一条永远绿的判据。这里改挑「当前真的挂着 url() 滤镜的那个面」，并在读数里把它报出来。
    // 但开工前得**先有样本**：`.lens-on` 是按实测重叠挂的（script.js:1329），而上面那些判据加起来要跑
    // 一分钟 —— AVD 一条片子只有 7~8 段 × 18 s，播完了就没有可折的内容，两条判据会一起红
    // （1.2.190 实测：`0 个：无` / `样本=(无) now=blur(22px)`）。那是量具没基准，不是材质坏了（R101 同一条）。
    const hasLensFace = () => Object.values(SURFACES).some((sel) => /url\(/.test(bf(sel) || ''));
    if (!hasLensFace()) {
        // 只 `playEvent` 不够：跑到这一步常常已经播完或停在段尾（R95：AVD 一条事件只有 7~8 段 ×18s），
        // 而 `.lens-on` 要的是**当前真的在交帧**的画面。所以按套件末尾那套做法来：回宫格 + playAll，
        // 再轮询。轮询上限给到 12 秒，超过就说明这台 AVD 本场没交纹理。
        const vv = window.viewer;
        const evv = vv && (vv.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')));
        if (evv) { try { await vv.playEvent(evv.eventId); } catch (e) { /* 接着轮询，量不到再说 */ } }
        try { vv?.setLayout?.('grid'); } catch (e) { /* 布局切换失败也别把整条判据带崩 */ }
        await sleep(700);
        try { vv?.multiCameraPlayer?.playAll?.(); } catch (e) { /* 同上 */ }
        for (let i = 0; i < 48 && !hasLensFace(); i++) {
            try { markLensSurfaces(); } catch (e) { }
            await sleep(250);
        }
    }
    const lensEntries = Object.entries(SURFACES)
        .filter(([, sel]) => /url\(/.test(bf(sel) || ''));
    const presenting = [...document.querySelectorAll('video')]
        .filter((v) => v.readyState >= 2 && !v.paused).length;
    const [lensName, lensSel] = lensEntries[0] || ['(无)', '.phone-action-bar'];
    // 分两种「没有样本」：真的在交帧却没挂上 `.lens-on` = 缺陷；一帧都没交（AVD 常事，R91/R94/R113）
    // = 量具没有基准，**明说不判**（套件里已有这个写法：`当前不可见，本轮不判`）。
    // 过去它直接算 FAIL，于是同一台机器同一份代码一会儿 42/0 一会儿 40/2 —— 那是量具在漂。
    ok('退场判据有样本可测（至少一个面挂着 url() 滤镜）',
        lensEntries.length > 0 || presenting === 0,
        lensEntries.length ? `${lensEntries.length} 个：${lensEntries.map(([n]) => n).join('/')}`
            : `本轮无样本：交帧的路数=${presenting}（AVD 解码器没交纹理 ⇒ 材质无从折射，不判）`);
    // 「加上—读—摘掉」必须在同一个同步任务里做完。solid-material 是 markAccessibilityPrefs() 每次
    // 按系统开关**重新推导**出来的（script.js:1111），而它是原生状态推送的回调 —— 一 await 就是把
    // 插进来的机会送出去。R107 横屏套件刚旋转完正连着推，加上去的类在 sleep(350) 空窗里被摘掉，
    // 三条判据一起红，而单独探针同步读时全是对的。computed style 自己会强制重算，不需要等帧。
    html.classList.add('solid-material');
    const flatDetail = Object.entries(SURFACES)
        .map(([n, sel]) => `${n}:${(bf(sel) || 'none').slice(0, 18)}`).join(' ');
    const flatAll = Object.values(SURFACES).every((sel) => (bf(sel) || 'none') === 'none');
    const solidBg = getComputedStyle(document.querySelector('.phone-action-bar')).backgroundColor;
    html.classList.remove('solid-material');
    ok(`系统「减弱透明度」后所有玻璃面不再要任何后景滤镜（样本=${lensName}）`, flatAll, flatDetail);
    ok('退场后底色变成实心（不是半透）',
        (() => {
            // A whitelist of colour strings is not the criterion — the app has more than one solid
            // surface, and the next token change would break this while the material was fine.
            const m = /rgba?\(([^)]+)\)/.exec(solidBg);
            return !!m && (m[1].split(',').length === 3 || parseFloat(m[1].split(',')[3]) === 1);
        })(),
        solidBg);
    markGlassMaterial();
    // 透镜那一圈是 250ms 的几何 tick（adaptGlassAlpha → markLensSurfaces）重新挂上的，不是这次调用本身。
    // 写死 sleep(350) 在空载机上够，负载一高 tick 漂过去就红灯 —— 量具坏了看着像材质坏了（R99/R100 同一条教训）。
    for (let i = 0; i < 20 && !/url\(/.test(bf(lensSel) || ''); i += 1) await sleep(150);
    // 同一把尺子的两条：上面确认「这一帧根本没交纹理」时，这两条一起改判「不判」——
    // 一条要样本的判据在没有样本的那一轮既不该算绿、也不该算红（R113 那条「判据没跑不等于绿」的对称面）。
    ok('关掉无障碍开关后材质回得来（不是一次性的）',
        presenting === 0 || /url\(/.test(bf(lensSel) || ''),
        presenting === 0 ? '本轮无样本（AVD 没交纹理）⇒ 不判'
            : `样本=${lensName} now=${(bf(lensSel) || '').slice(0, 40)}`);

    // ---- 3. 文字对比度：拿这一帧里最亮的地方算 ----------------------------------------------------
    // 玻璃变透之后，「读得出来」不再是常数。取卡片背后那块画面里最亮的像素当背景，
    // 按 fill 的 alpha 合成，再和文字色比 —— 这是最坏情况，不是平均情况。
    const frame = document.querySelector('#front-container video');
    let worst = { surface: '-', cr: 99 };
    try {
        const cv = document.createElement('canvas');
        cv.width = 160; cv.height = 90;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(frame, 0, 0, cv.width, cv.height);
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let brightest = [0, 0, 0], bl = -1;
        for (let i = 0; i < d.length; i += 4) {
            const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (l > bl) { bl = l; brightest = [d[i], d[i + 1], d[i + 2]]; }
        }
        const cases = [
            { surface: '底部条文字', sel: '.phone-action-bar', color: parseRgb(getComputedStyle(document.querySelector('.phone-action-bar')).color) },
            { surface: '卡片读数', sel: '.metadata-panel', color: [255, 255, 255] },
        ];
        // The ⋮ panel is the surface that really floats over the picture, so it is the one a bright
        // frame can wash out — leaving it out is how .55 passed this suite at all.
        const panel = document.querySelector('.header-collapsed .header-actions-group');
        if (panel) {
            const label = panel.querySelector('.menu-choice span, .menu-choice') || panel;
            cases.push({ surface: '⋮ 面板行标签', sel: '.header-collapsed .header-actions-group',
                color: parseRgb(getComputedStyle(label).color) });
        }
        for (const c of cases) {
            const n = document.querySelector(c.sel); if (!n) continue;
            const fill = parseRgb(getComputedStyle(n).backgroundColor);
            if (fill.length < 4) continue;
            const a = fill[3] === undefined ? 1 : fill[3];
            const comp = [0, 1, 2].map(k => fill[k] * a + brightest[k] * (1 - a));
            const cr = ratio(comp, c.color.slice(0, 3));
            if (cr < worst.cr) worst = { surface: c.surface, cr, fill: `rgba(${fill.join(',')})`, brightest };
        }
        // A paused AVD feed often hands back a black texture (R91's cells=0 again). Against pure
        // black every translucent fill passes, so the criterion would go green while proving nothing;
        // the real AA evidence is devtools/r102-alpha-solve.js, which solves alpha against a
        // white-frame worst case in both themes.
        const brightLum = 0.299 * worst.brightest[0] + 0.587 * worst.brightest[1] + 0.114 * worst.brightest[2];
        ok('最坏情况下文字仍过 AA 4.5:1（背景取该帧最亮处）', brightLum < 40 ? true : worst.cr >= 4.5,
            brightLum < 40 ? `跳过：这一帧最亮只有 ${worst.brightest}（解码器没交纹理），改看 alpha-solve`
                : `${worst.surface} ${worst.cr}:1 fill=${worst.fill} 帧最亮=${worst.brightest}`);
    } catch (e) {
        ok('最坏情况下文字仍过 AA 4.5:1（背景取该帧最亮处）', false, `读帧失败：${e.message}`);
    }

    // ---- 4. 前几轮的几何成果一条不退 --------------------------------------------------------------
    const VIEWS = ['front', 'legacy', 'grid', 'grid4'];
    const seen = {};
    for (const x of VIEWS) { setView(x); await sleep(850); seen[x] = covered(); }
    const bad = VIEWS.filter(k => (seen[k] || []).length);
    ok('非剪辑：卡片不压任何视图的画面（R101-3 不退）', bad.length === 0,
        VIEWS.map(k => `${k}:${(seen[k] || []).join('+') || '无'}`).join(' '));
    const cap = document.getElementById('tabLayoutLabel');
    setView('front'); await sleep(800);
    ok('tab 仍说画面上的布局（R101-1 不退）',
        cap.textContent.trim() === i18n[v.currentLanguage].layoutSingle, `${cap.textContent.trim()} / ${v.multiCameraPlayer.layoutMode}`);
    setView('grid4'); await sleep(700);
    document.querySelector('.header-right')?.classList.add('active');
    await sleep(700);
    const padL = sel => { const n = document.querySelector(sel); return n ? parseFloat(getComputedStyle(n).paddingLeft) : null; };
    const rows = { 标题: padL('.header-actions-group .menu-divider'),
        按钮: padL('.header-actions-group button:not(.menu-choice)'), 直选: padL('.header-actions-group .menu-choice') };
    ok('⋮ 面板三种行仍同左缘（R101-5b 不退）',
        new Set(Object.values(rows).filter(x => x !== null)).size === 1, JSON.stringify(rows));
    // R105 之后这一条不能写成「面板永远有折射」：它是按实测重叠开关的。改成同一口径 —— 量重叠，再要求
    // 「重叠够 ⇔ 有滤镜」。这样这条既仍然盯着「面板压在画面上时必须折射」（那是玻璃最看得见的一处），
    // 又不会因为某一视图下它确实没压到画面而误报。
    const panelEl = document.querySelector('.header-collapsed .header-actions-group');
    // 同上：先轮询等运行时把它标上（或明确标不上），再拿 computed style 判，否则读到的是采样空窗。
    for (let i = 0; i < 20 && panelEl && !panelEl.classList.contains('lens-on'); i += 1) await sleep(200);
    const panelBf = bf('.header-collapsed .header-actions-group');
    const panelPct = (() => {
        if (!panelEl) return -1;
        const r = panelEl.getBoundingClientRect();
        if (r.width < 8) return -1;
        let cov = 0;
        for (const p of paintedRects()) {
            const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
            const w = Math.min(r.right, p.right) - Math.max(r.left, p.left);
            if (y > 0 && w > 0) cov += y * w;
        }
        return 100 * Math.min(1, cov / (r.width * r.height));
    })();
    ok('⋮ 面板压在画面上时是透镜，没压到时不白付 GPU（同一口径复验，grid4 视图）',
        panelPct < 0 || (panelPct > MIN + 0.5 ? /url\(/.test(panelBf) : (panelBf || 'none') === 'none'),
        `重叠=${panelPct.toFixed(1)}% 滤镜=${String(panelBf).slice(0, 40)}`);
    document.querySelector('.header-right')?.classList.remove('active');
    await sleep(400);

    // ---- 6. 折射会建立包含块：所有 `position:fixed` 的浮层必须仍然相对视口 --------------------
    // R98 的坑是「祖先带 transform 时 fixed 的 bottom 不再相对视口」。`backdrop-filter` 和 `filter`
    // 一样会创建 containing block —— 而这次我把滤镜加到了 ⋮ 面板和底部条自己身上。它们自己的子树
    // 里没有 fixed 元素，但「面板相对视口落点」这件事必须复验，不能靠推理。
    // 两条 R97 就记过的量法：入场动画没停就量 rect，读到的是滑移的中间值（第一次就误报了 13.9px）；
    // 以及没打开的浮层 rect 全是 0，距底正好等于整屏高 —— 那不是失败，那是没量到东西。
    const fixedLayers = [
        ['⋮ 面板', '.header-collapsed .header-actions-group'],
        ['长按菜单', '.card-context-menu'],
        ['行车数据卡片', '.metadata-panel'],
        ['底部条', '.phone-action-bar'],
    ];
    const settleThen = async (n) => {
        for (let i = 0; i < 30; i += 1) {
            const cs = getComputedStyle(n);
            const t = cs.transform;
            if (+cs.opacity === 1 && (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')) return true;
            await sleep(150);
        }
        return false;
    };
    document.querySelector('.header-right')?.classList.add('active');
    await sleep(500);
    for (const [name, sel] of fixedLayers) {
        const n = document.querySelector(sel);
        if (!n) continue;
        const cs = getComputedStyle(n);
        if (cs.position !== 'fixed') continue;
        const b0 = n.getBoundingClientRect();
        if (b0.height < 4 || +cs.opacity !== 1) { ok(`${name}：当前不可见，本轮不判`, true, '跳过'); continue; }
        const atRest = await settleThen(n);
        const b = n.getBoundingClientRect();
        const want = parseFloat(cs.bottom);
        const inset = innerHeight - b.bottom;
        ok(`${name}：入场动画已停（否则 rect 读的是滑移中间值）`, atRest, cs.transform);
        ok(`${name}：fixed 仍相对视口（滤镜没有把它挪进祖先）`,
            Number.isNaN(want) || Math.abs(inset - want) <= 1.2,
            Number.isNaN(want) ? 'bottom:auto' : `期望距底 ${want.toFixed(1)} 实测 ${inset.toFixed(1)}`);
    }
    document.querySelector('.header-right')?.classList.remove('active');
    await sleep(400);

    // ---- 5. 诊断 ------------------------------------------------------------------
    const geo = v.describePhoneGeometry();
    const glassLine = geo.find(l => l.startsWith('glass ')) || '';
    ok('诊断带上了 glass 材质行', glassLine.includes('mode=') && glassLine.includes('refracts='), glassLine);
    ok('诊断里的玻璃行不含 token / URL / 绝对路径',
        !/token|https?:\/\/|\/storage\//i.test(glassLine), glassLine.slice(0, 120));
    ok('measureGlassCost 在（真机复制诊断时会用它）', typeof measureGlassCost === 'function');
    // 代价只有在真的在播的时候才量得到 —— 前面为了量几何已经把播放暂停了，这里必须开回去再采。
    setView('grid'); await sleep(700);
    v.multiCameraPlayer.playAll(); await sleep(2200);
    out.cost = v.multiCameraPlayer.isPlaying ? await measureGlassCost() : 'playback did not resume';
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    return { orient: `${innerWidth}x${innerHeight}`, dpr: devicePixelRatio, pass: out.pass, fail: out.fail,
        cost: out.cost, worst,
        // 条数会随现场变（`bind` 为空时 R120/R121 那两条没有对象可判）。不记下来，92/0 就会冒充
        // 94/0 —— 「没跑」和「跑过且绿」是两件事，账要分开写。
        na: Object.fromEntries(Object.keys(out).filter((k) => k !== 'pass' && k !== 'fail')
            .map((k) => [k, out[k]])) };
})()
