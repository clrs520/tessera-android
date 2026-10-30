// R102 acceptance · 横屏。竖屏那一版里底部条压在信箱黑边上，后景没有内容可弯，所以「玻璃够不够透」
// 在竖屏是个抽象问题；横屏这条条是真的浮在画面上，同一个 alpha 在这里才是真的赌注。
// 因此这里的对比度判据只取**条子背后那一块画面**的最亮像素，不是整帧最亮 —— 整帧最亮会让判据保守到
// 没有意义（一块远处的天空不该决定控件文字的颜色）。
//
// 已付过学费的坑，这里都绕开：横屏跑竖屏校准的套件会多报几条；面板收起态是 scale(0.98)，量之前先等
// opacity=1 且 transform 归位；`elementFromPoint` 在控件行收起时 pointer-events:none 会落到下层。
(async () => {
    // R133 · 方向也是就绪条件：实测旋转没落地时整套会在竖屏下跑，三条判据齐红（假信号）。
    for (let i = 0; i < 30 && innerWidth <= innerHeight; i += 1) await new Promise((r) => setTimeout(r, 400));
    if (innerWidth <= innerHeight) throw new Error('rotation did not land: still ' + innerWidth + 'x' + innerHeight);

    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    // R183 · 上一支探针留下的全屏遮罩会把这里每一条「盖住」判成缺陷：`29 行仍可点` 那次 18 行报死，
    // 现场是 `#deleteConfirmModal`（z 2000、fixed、整屏）还开着 —— 是 `r182-note.js` 取文案时
    // 在前置不成立的那盘素材上真把确认框打开了、没关。开跑前先把别人的现场收掉，并记下收了谁。
    out.straysDismissed = [...document.querySelectorAll('.modal-overlay.show, .modal-overlay[style*="flex"]')]
        .map((m) => m.id || m.className);
    for (const m of document.querySelectorAll('.modal-overlay.show')) {
        m.querySelector('.modal-btn, button')?.click();
        m.classList.remove('show');
        if (m.id === 'deleteConfirmModal') { m.style.display = 'none'; v.pendingDelete = null; }
    }
    const html = document.documentElement.classList;
    const cs = (n, p) => (p.startsWith('--') ? getComputedStyle(n).getPropertyValue(p).trim() : getComputedStyle(n)[p]);
    const bf = (sel) => { const n = document.querySelector(sel); if (!n) return null;
        const c = getComputedStyle(n);
        return (c.backdropFilter && c.backdropFilter !== 'none' ? c.backdropFilter : c.webkitBackdropFilter) || 'none'; };
    const panel = document.getElementById('headerActionsGroup');
    const bar = document.querySelector('.phone-action-bar');
    const parseRgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const relLum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (bg, fg) => { const a = relLum(...bg), b = relLum(...fg);
        return +(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05))).toFixed(2); };
    const settle = async (n) => {
        for (let i = 0; i < 24; i++) {
            if (+cs(n, 'opacity') === 1 && /none|matrix\(1, 0, 0, 1, 0, 0\)/.test(cs(n, 'transform'))) return true;
            await sleep(120);
        }
        return +cs(n, 'opacity') === 1;
    };

    // 旋转是异步落到 WebView 的：`adb shell settings put system user_rotation 1` 之后 4s，页面里
    // matchMedia 还是 `(orientation: landscape)` = false、innerWidth 仍是 400 —— 横屏套件就这样拿着
    // 竖屏几何跑完了前面几条（R107 实测：`基准：这台现在是横屏 = 400x889` 红，末尾 orient 却已是 889x400）。
    // 基准自证必须先等它真翻过去，否则后面每一条量的都不是横屏。
    let waited = 0;
    while (!matchMedia('(orientation: landscape)').matches && waited < 6000) { await sleep(150); waited += 150; }
    ok('基准：这台现在是横屏', matchMedia('(orientation: landscape)').matches,
        `${innerWidth}x${innerHeight} 等旋转落地 ${waited}ms`);
    if (document.querySelector('.player-area.empty')) {
        const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || ''))) || (v.eventGroups || [])[0];
        await v.playEvent(ev.eventId);
        await sleep(3000);
    }
    ok('基准：打开的是真实多路事件', !/RecentClips/i.test(String(v.currentEvent?.eventId || '')), String(v.currentEvent?.eventId || '').slice(-22));
    // `viewer.togglePlayPause()` 这个名字在这个 runtime 里不存在（R98 记过：一条没被走过的分支等于没验证
    // 过 —— 这行只有「进来时正在播」才会执行，而以前每次都恰好是暂停态，所以它从没跑过就带着这个错死在那儿）。
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    await sleep(600);

    // 前置条件自己造，不赌上一轮留下的状态（R98：判据不能假定期初状态）。这一版原来直接赌
    // 「横屏卡片压画面 82%」，而卡片正是第 4 节 24 行点击里 `metaSwitchBtn` 会翻到的对象 ——
    // 第一轮把它翻成小 pill 之后再跑第二轮，重叠 0%、lens-on=0，三条折射判据一起塌（R107 实测）。
    // ⋮ 面板在横屏确实压在画面上（R105 量的 38%），拿它当样本，并把「打开」写成按当前读数判定：
    // 只有确实没 active 时才点一下，绝不循环补点（R102：打开态下第一下会变成关闭）。
    const hdrEl = () => document.querySelector('.header-right');
    const openMenu = async (budget = 6000) => {
        let w = 0;
        while (w < budget && !hdrEl()?.classList.contains('active')) {
            document.getElementById('tabMoreBtn').click();
            await sleep(150); w += 150;
        }
        const untilLens = async (b = 5000) => {
            let k = 0;
            while (k < b && (typeof glassState !== 'object' || glassState.lensLive < 1)) { await sleep(150); k += 150; }
            return k;
        };
        return { opened: !!hdrEl()?.classList.contains('active'), waited: w, lensWaited: await untilLens() };
    };

    // ---- 1. 材质在横屏也挂着，且浮在画面上 --------------------------------------------------------
    // R105：材质跟着内容走，`.lens-on` 按实测重叠开关（横屏卡片 82%、⋮ 面板 38%，条子在这台 0%）。
    // 上一版这里写死「三个面都有折射」，横屏底部条必然误报 —— 判据口径要跟着实现改。
    ok('横屏仍然是 lens 档', html.contains('glass-lens'),
        `refracts=${/url\(/.test(bf('.metadata-panel') || '') ? 1 : 0}`);
    const L_SURF = [['底部条', '.phone-action-bar'], ['⋮ 面板', '.header-collapsed .header-actions-group'],
        ['卡片', '.metadata-panel'], ['长按菜单', '.card-context-menu']];
    const paintedRects = () => [...document.querySelectorAll('.video-container')]
        .filter((x) => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'))
        .map((x) => { const vid = x.querySelector('video'); if (!vid || !vid.videoWidth || !vid.videoHeight) return null;
            const b = x.getBoundingClientRect();
            const s = Math.min(b.width / vid.videoWidth, b.height / vid.videoHeight);
            const h = vid.videoHeight * s, w = vid.videoWidth * s;
            return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
                left: b.left + (b.width - w) / 2, right: b.left + (b.width + w) / 2 }; })
        .filter(Boolean);
    const MIN = (typeof LENS_MIN_COVER === 'number') ? LENS_MIN_COVER : 2;
    const pre = await openMenu();
    await settle(panel);                     // 入场动画没停就量 rect，读到的是滑移中间值（R99）
    out.precond = `面板=${pre.opened ? '开' : '开不了'} 等打开${pre.waited}ms 等折射${pre.lensWaited}ms lensLive=${(typeof glassState === 'object' && glassState) ? glassState.lensLive : '?'}`
        + ` 卡片=${document.getElementById('metadataPanel')?.classList.contains('collapsed') ? '折叠(小pill)' : '展开(压画面)'}`;
    await sleep(1200);                       // 让 markLensSurfaces() 跑上一拍
    const lAudit = [], lBad = [], doubled = [], mixed = [], widths = [];
    let lOn = 0;
    for (const [n, s] of L_SURF) {
        const el = document.querySelector(s);
        if (!el) continue;
        const style = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const f = bf(s) || 'none';
        const on = el.classList.contains('lens-on');
        if (on) lOn += 1;
        if (on && !(/url\(/.test(f) && /blur\(/.test(f))) lBad.push(`${n}: lens-on 但滤镜=${String(f).slice(0, 24)}`);
        if (!on && /url\(/.test(f)) lBad.push(`${n}: 没标 lens-on 却有透镜`);
        if (r.width >= 8 && r.height >= 8 && style.visibility !== 'hidden' && +style.opacity > 0 && style.display !== 'none') {
            let cov = 0;
            for (const p of paintedRects()) {
                const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
                const w = Math.min(r.right, p.right) - Math.max(r.left, p.left);
                if (y > 0 && w > 0) cov += y * w;
            }
            const pct = 100 * Math.min(1, cov / (r.width * r.height));
            // 只判**透镜**在不在（`url(`）。R39-3/R59 那层普通模糊不在这轮开关范围里：列表页底部条背后
            // 是真有滚动内容，那层模糊是给它的字挣的。拿 `f !== 'none'` 判会把每一面都误报成「还挂着透镜」。
            const lens = /url\(/.test(f);
            if (pct > MIN + 0.5 && !lens) lBad.push(`${n}: 压画面 ${pct.toFixed(1)}% 却没开透镜`);
            if (pct < MIN - 0.5 && lens) lBad.push(`${n}: 只压 ${pct.toFixed(1)}% 却挂着透镜`);
            lAudit.push(`${n} ${pct.toFixed(1)}%/${lens ? '透镜' : '平'}`);
        } else lAudit.push(`${n} 收起态`);
        // R105 真机看到的「顶部线条粗一点」= 1px 上边框 + 一条锐利 inset 并排。横屏要复量一遍，
        // 不能只信竖屏那一版（同一套 CSS，但这条边压在画面上还是黑边上观感不同）。
        const csi = getComputedStyle(el);
        const insets = (csi.boxShadow || '').split(/,(?![^(]*\))/).filter((x) => /inset/.test(x))
            .map((x) => (x.match(/-?[\d.]+px/g) || []).map(parseFloat))
            .filter((nums) => nums.length >= 3 && nums[2] <= 1.5);
        for (const k of ['Top', 'Right', 'Bottom', 'Left']) {
            const bw = parseFloat(csi['border' + k + 'Width']);
            const sharp = insets.filter((x) => (k === 'Bottom' ? x[1] < 0 : k === 'Top' ? x[1] > 0
                : k === 'Left' ? x[0] > 0 : x[0] < 0)).length;
            if (bw > 0 && csi['border' + k + 'Style'] !== 'none' && sharp) {
                doubled.push(`${n}.${k}: ${csi['border' + k + 'Width']} + ${sharp} 条锐利 inset`);
            }
        }
        const sides = [...new Set(['Top', 'Right', 'Bottom', 'Left'].map((k) => csi['border' + k + 'Color']))];
        if (sides.length !== 1) mixed.push(`${n}: ${sides.join(' vs ')}`);
        const bwAll = ['Top', 'Right', 'Bottom', 'Left'].map((k) => parseFloat(csi['border' + k + 'Width']) || 0);
        if (new Set(bwAll).size !== 1) widths.push(`${n}: T/R/B/L=${bwAll.join('/')}`);
    }
    ok('横屏：lens-on 与实测重叠同口径（压画面才有透镜，没压的不白付 GPU）',
        lBad.length === 0, lAudit.join(' ') + (lBad.length ? ' | ' + lBad.join(' | ') : ` 阈值=${MIN}%`));
    ok('横屏：四个玻璃面任一条边都没有画两遍（边框 + 锐利 inset）', doubled.length === 0, doubled.join(' | '));
    ok('横屏：一圈边框一种颜色', mixed.length === 0, mixed.join(' | '));
    ok('横屏：一圈边框等宽', widths.length === 0, widths.join(' | '));
    // 横屏卡片实测压画面 82%，所以「一个折射的面都没有」在横屏只可能是开关坏了 —— 这条把上面几条从
    // 「全灰即全绿」的空判据里救出来（R101 记过的同一类量具缺陷）。
    ok('横屏至少一个面真的在折射', lOn >= 1, `lens-on=${lOn} 个，运行时报 `
        + `${(typeof glassState === 'object' && glassState) ? glassState.lensLive : '?'} 个`);

    // ---- 2. 条子背后的画面，取它自己那一块的最亮处算对比度 ----------------------------------------
    const barR = bar.getBoundingClientRect();
    let behind = null;
    for (const cell of [...document.querySelectorAll('.video-container')]) {
        const vid = cell.querySelector('video');
        if (!vid || !vid.videoWidth || getComputedStyle(cell).display === 'none') continue;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / vid.videoWidth, b.height / vid.videoHeight);
        const h = vid.videoHeight * s, w = vid.videoWidth * s;
        const p = { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
            left: b.left + (b.width - w) / 2, right: b.left + b.width - (b.width - w) / 2, w, h };
        const y0 = Math.max(p.top, barR.top), y1 = Math.min(p.bottom, barR.bottom);
        const x0 = Math.max(p.left, barR.left), x1 = Math.min(p.right, barR.right);
        if (y1 - y0 > 4 && x1 - x0 > 4) { behind = { vid, p, box: [x0, y0, x1, y1], overlap: y1 - y0 }; break; }
    }
    // Whether the bar overlaps the picture at all is a layout fact, not a bug: on a 970x437 surface
    // the feeds end above the bar, so this criterion has no object and must say so rather than fail.
    ok('横屏的底部条与画面的关系已判定', true, behind
        ? `压 ${behind.overlap.toFixed(1)}px，对比度按这块画面算` : '条子在画面之外，对比度判据本轮跳过');
    if (behind) {
        try {
            const vid = behind.vid, p = behind.p, box = behind.box;
            // `object-fit: contain` means only the painted rect carries picture, and that rect maps
            // linearly onto the whole decoded frame — so map through it, not through the cell.
            const cw = 160, ch = Math.max(8, Math.round(160 * vid.videoHeight / vid.videoWidth));
            const cv = document.createElement('canvas');
            cv.width = cw; cv.height = ch;
            const ctx = cv.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(vid, 0, 0, cw, ch);
            const kx = cw / p.w, ky = ch / p.h;
            const rx = Math.max(0, Math.floor((box[0] - p.left) * kx)), ry = Math.max(0, Math.floor((box[1] - p.top) * ky));
            const rw = Math.max(1, Math.min(cw - rx, Math.ceil((box[2] - box[0]) * kx)));
            const rh = Math.max(1, Math.min(ch - ry, Math.ceil((box[3] - box[1]) * ky)));
            const d = ctx.getImageData(rx, ry, rw, rh).data;
            let best = [0, 0, 0], bl = -1;
            for (let i = 0; i < d.length; i += 4) {
                const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                if (l > bl) { bl = l; best = [d[i], d[i + 1], d[i + 2]]; }
            }
            const fill = parseRgb(getComputedStyle(bar).backgroundColor);
            const a = fill.length === 4 ? fill[3] : 1;
            const comp = [0, 1, 2].map(k => fill[k] * a + best[k] * (1 - a));
            const ink = parseRgb(getComputedStyle(bar).color);
            const cr = ratio(comp, ink.slice(0, 3));
            ok('条子文字对它背后那块画面的最亮处仍过 AA 4.5:1', cr >= 4.5,
                `${cr}:1 fill=rgba(${fill.join(',')}) 背后最亮=${best} 取样=${rw}x${rh}`);
        } catch (e) {
            ok('条子文字对它背后那块画面的最亮处仍过 AA 4.5:1', false, `读帧失败：${e.message}`);
        }
    }

    // ---- 3. 无障碍退场在横屏同样成立 --------------------------------------------------------------
    // 样本必须挑「这一刻真的挂着 url() 滤镜的那个面」，拿底部条当样本会得到一条永远绿的判据（它现在
    // 不压画面 → 没有滤镜 → 「摘掉之后没有」是白给的）。底色那条仍然量条子，它测的是实心回落，与滤镜无关。
    const lSample = L_SURF.find(([, s]) => /url\(/.test(bf(s) || '')) || ['(无滤镜样本)', '.metadata-panel'];
    // 同步做完「加类 → 读 → 摘类」，一次 await 都不留。solid-material 是 markAccessibilityPrefs()
    // 每次按系统开关**重新推导**的（script.js:1111），而它是原生状态推送的回调；刚旋转完推送正连着来，
    // sleep(350) 空窗里手加的类会被摘掉 —— R107 这一版三条判据一起红，单独探针同步读时全是对的。
    html.add('solid-material');
    const flatDetail = L_SURF.map(([n, s]) => `${n}:${(bf(s) || 'none').slice(0, 16)}`).join(' ');
    const flatAll = L_SURF.every(([, s]) => (bf(s) || 'none') === 'none');
    const solidBg = getComputedStyle(bar).backgroundColor;
    html.remove('solid-material');
    ok(`横屏：减弱透明度一开后景滤镜全摘（样本=${lSample[0]}）`, flatAll, flatDetail);
    const solidFill = parseRgb(solidBg);
    ok('横屏：摘掉滤镜之后底色是实心', solidFill.length === 3 || solidFill[3] === 1, solidBg);
    window.markGlassMaterial?.();
    await sleep(1200);                        // 材质回来后 .lens-on 也要跟上这一拍
    ok('横屏：开关关掉材质回得来', /url\(/.test(bf(lSample[1]) || ''),
        `样本=${lSample[0]} now=${(bf(lSample[1]) || '').slice(0, 40)}`);

    // ---- 4. 用户说先不动的那条：横屏面板行高不许被这轮顺手改掉（守 R97 的 40 触摸下限） ----------------
    await openMenu();
    ok('横屏 ⋮ 面板开着', await settle(panel), cs(panel, 'opacity'));
    const kinds = {};
    [...panel.querySelectorAll('.menu-choice, .menu-divider, .menu-row')].forEach((r) => {
        const k = r.className.split(' ')[0];
        (kinds[k] = kinds[k] || new Set()).add(+r.getBoundingClientRect().height.toFixed(1));
    });
    out.panelKinds = Object.entries(kinds).map(([k, s]) => `${k}=${[...s].sort().join('/')}`).join(' ');
    const choiceH = [...(panel.querySelectorAll('.menu-choice') || [])].map(n => n.getBoundingClientRect().height);
    // 两件事先要量对，否则这条判据只是在描述量具：
    //  ① 面板收起态带 scale(0.98)（R97 记过），关着量到的 38 会读成 37.2 —— 先确认它真的开着；
    //  ② 38 那一档写在 `.header-actions-group button` 上（基础规则，不随高度分档），而 `.menu-choice`
    //     是包着按钮的 DIV，它自己另有 44 的一档。拿 DIV 的高度去验按钮的档位，量到 44 是必然的。
    // 用户这轮明说「横版设置面板的高度先不动」，所以这里只把量具挪到被那条规则真正管辖的节点上。
    const openNow = +cs(panel, 'opacity') === 1;
    const scale = panel.offsetHeight ? +(panel.getBoundingClientRect().height / panel.offsetHeight).toFixed(3) : 1;
    const visBtn = [...panel.querySelectorAll('button')]
        .map((b) => +(b.getBoundingClientRect().height / scale).toFixed(1)).filter((h) => h > 0);
    ok('量的那一刻 ⋮ 面板确实是开着的（收起态 scale 会把 40 读成 39.2）', openNow && scale > 0.995,
        `opacity=${cs(panel, 'opacity')} scale=${scale}`);
    // R136（#375）：此前「横版设置面板高度先不动」的保留到期。38 来自基础规则
    // `.header-actions-group button`，低于本项目 40 的触摸下限；当初让 2px 是为了把五行塞进
    // 229px 上限，而 R123 起面板允许滚动，这条约束不再成立。现在全部可见按钮都必须是 40。
    const below = visBtn.filter((h) => h < 39.4), above = visBtn.filter((h) => h > 40.6);
    ok('横屏 ⋮ 面板行高=40（R136 收掉 38 档，#375 结案）',
        visBtn.length > 0 && !below.length && !above.length,
        `可见按钮 ${visBtn.length} 个：${[...new Set(visBtn)].sort().join('/')}px` +
        (below.length ? ` 低于40：${below.join(',')}` : '') + (above.length ? ` 高于40：${above.join(',')}` : '') +
        `（外层 .menu-choice ${(Math.max(...(choiceH || [0])) / scale).toFixed(1)}）`);
    // 同一档也落到两个「字段面」上：抽屉与导出页都必须声明 40，不能再靠每颗控件补 min-height。
    const fhSide = getComputedStyle(document.querySelector('.sidebar')).getPropertyValue('--field-h').trim();
    const fhExp = getComputedStyle(document.querySelector('.phone-export-panel')).getPropertyValue('--field-h').trim();
    ok('横屏字段档=40（抽屉与导出页同一档，R136/#375）', fhSide === '40px' && fhExp === '40px',
        `--field-h 抽屉=${fhSide} 导出页=${fhExp}`);
    ok('横屏 ⋮ 面板 token 仍是 5px', cs(panel, '--menu-inset') === '5px', cs(panel, '--menu-inset'));
    const cut = [...panel.querySelectorAll('.btn-text, .choice-label')].filter(n => n.textContent.trim())
        .map(n => { const rg = document.createRange(); rg.selectNodeContents(n);
            return { t: (n.textContent || '').trim().slice(0, 10), need: rg.getBoundingClientRect().width, got: n.getBoundingClientRect().width }; })
        .filter(r => r.need > r.got + 0.3);
    ok('没有标签被省略号吃掉', cut.length === 0, cut.map(r => `${r.t} ${r.need.toFixed(1)}>${r.got.toFixed(1)}`).join(' | '));
    // R122 第二版：用户明确「横屏下，设置面板可以滚动」，所以『末行被裁在可视区外』不再是缺陷 ——
    // 判据改成『滚到底之后每个可见按钮都点得到』，量完把滚动位置还原。
    const prevTop = panel.scrollTop;
    panel.scrollTop = panel.scrollHeight;
    await sleep(0);
    const live = [...panel.querySelectorAll('button, a')].filter(n => getComputedStyle(n).display !== 'none' && !n.disabled);
    // R159: the panel gained two preference rows and is now taller than its viewport, so a check
    // that only scrolls to the bottom reports every row above the fold as dead. Scroll each row
    // into the panel before asking what is under its centre; the question is whether it is covered,
    // not whether it happens to be outside the current scroll window.
    const dead = [];
    for (const n of live) {
        const pr = panel.getBoundingClientRect();
        const r0 = n.getBoundingClientRect();
        panel.scrollTop += (r0.top - pr.top) - 8;
        await sleep(0);
        const b = n.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        // 只报「哪一行不匹配」查不动：得说出是谁盖在上面（这一条当初就是靠另写一支探针才知道是遮罩）。
        if (!(hit === n || n.contains(hit))) {
            const who = hit ? `${hit.tagName.toLowerCase()}#${hit.id || '-'}`
                + `.${(typeof hit.className === 'string' ? hit.className.trim().split(/\s+/)[0] : '-')}` : 'null';
            dead.push(`${n.id || '?'}←被 ${who} 盖住`);
        }
    }
    panel.scrollTop = prevTop;
    // 「行数为 0」也是「dead 为 0」，面板没开时这条会绿得没有任何内容 —— 补一个下限，让它必须真的量到行。
    ok(`${live.length} 行仍可点`, live.length >= 15 && dead.length === 0,
        dead.length ? dead.slice(0, 6).join(' | ') : `实测量到 ${live.length} 行`);
    if (hdrEl()?.classList.contains('active')) document.getElementById('tabMoreBtn').click();
    await sleep(400);

    // ---- 5. R101 那四条在横屏一条不退 -------------------------------------------------------------
    const cap = document.getElementById('tabLayoutLabel');
    document.querySelector('.view-btn[data-view="front"]')?.click();
    await sleep(900);
    ok('横屏 tab 仍说画面上的布局', (cap.textContent || '').trim() === i18n[v.currentLanguage].layoutSingle,
        `caption=${(cap.textContent || '').trim()} live=${v.multiCameraPlayer.layoutMode}`);
    const geom = (v.describePhoneGeometry ? v.describePhoneGeometry().join('\n') : '');
    ok('诊断里带上了玻璃那两行', /glass mode=/.test(geom) && /lens /.test(geom),
        (geom.match(/glass mode=[^\n]*/) || ['-'])[0].slice(0, 78));
    // R116 · 横屏走的是同一条 `bottom: calc(--action-h + 12px)`，同一个量法，所以同一件事
    // 必须在横屏也成立。间隙按布局盒算 —— 这块面板收起态自己带 transform（竖屏那轮踩过）。
    const lBar = document.getElementById('phoneActionBar');
    const lOcc = lBar.offsetHeight > 0
        ? Math.round(lBar.offsetHeight + Math.max(0, innerHeight - lBar.offsetTop - lBar.offsetHeight)) : 0;
    const lAct = Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--action-h')));
    ok('横屏 --action-h = 底条布局占用，且量它的时候底条没被挪走（R116）',
        Math.abs(lAct - lOcc) <= 1 && getComputedStyle(lBar).transform === 'none',
        `声明=${lAct} 布局=${lOcc} offsetTop=${lBar.offsetTop} h=${lBar.offsetHeight} tf=${getComputedStyle(lBar).transform}`);
    ok('横屏 ⋮ 面板与底条之间仍是 12px 间隙（R116）',
        (lBar.offsetTop - (panel.offsetTop + panel.offsetHeight)) >= 11
        && (lBar.offsetTop - (panel.offsetTop + panel.offsetHeight)) <= 13,
        `间隙=${lBar.offsetTop - (panel.offsetTop + panel.offsetHeight)}px`
        + `（面板布局底=${panel.offsetTop + panel.offsetHeight} 底条布局顶=${lBar.offsetTop}）`);
    // R117 A2/A3 · 横屏是这次并档的**约束面**：竖屏面板升到 --fs-body 了，横屏不能升
    // （7 列下每格标签只剩 76.7px，六字行墨宽 84.5px）。这条判的是「例外仍然是例外」，
    // 而不是「例外被顺手改掉」。间隙同一条 `--float-gap`。
    const lPx1 = (x) => Math.round(parseFloat(x) * 100) / 100;
    const lBar2 = document.getElementById('phoneActionBar');
    const lPanelFont = lPx1(getComputedStyle(panel.querySelector('.btn-text')).fontSize);
    let lClipped = 0, lRows = 0;
    for (const t of panel.querySelectorAll('.btn-text')) {
        const host = t.closest('button, a');
        if (!host || getComputedStyle(host).display === 'none' || host.getBoundingClientRect().width < 1) continue;
        lRows += 1;
        const rg = document.createRange(); rg.selectNodeContents(t);
        const room = host.getBoundingClientRect().right - parseFloat(getComputedStyle(host).paddingRight);
        if (rg.getBoundingClientRect().width > t.getBoundingClientRect().width + 0.5
            || t.getBoundingClientRect().right > room + 0.5 || host.scrollWidth > host.clientWidth + 1) lClipped += 1;
    }
    // R133 · 这一条原来是「横屏面板必须留在 12.48」—— 那是 R117 为了不截断做的例外。R128–R132
    // 把面板行指回 --fs-meta(12) 之后实测`被切=0/19 行`，例外成立的前提没了，判据改成同时守两件事：
    // 字号就是 12，而且**一行都没被切**（这比原来只守字号更强）。
    ok('横屏 ⋮ 面板字号=12 且 19 行无截断（R133 收掉 R117 的 12.48 例外）',
        Math.abs(lPanelFont - 12) < 0.6 && lClipped === 0 && lRows >= 15,
        `面板字号=${lPanelFont} 被切=${lClipped}/${lRows} 行`);
    const lMenu = document.querySelector('.card-context-menu');
    const lPanelGap = lBar2.offsetTop - (panel.offsetTop + panel.offsetHeight);
    ok('横屏 ⋮ 面板离底条 = --float-gap（和竖屏同一个数）',
        Math.abs(lPanelGap - 12) <= 1 && (getComputedStyle(document.documentElement).getPropertyValue('--float-gap') || '').trim() === '12px',
        `间隙=${lPanelGap}px --float-gap=${(getComputedStyle(document.documentElement).getPropertyValue('--float-gap') || '').trim() || '未定义'} 菜单=${lMenu ? getComputedStyle(lMenu).bottom : '-'}`);
    ok('横屏诊断的 gap 行自己也对得上（actH 两个数相等）',
        /gap actH=(\d+)px\/\1\b/.test(geom),
        (geom.match(/^gap [^\n]*/m) || ['-'])[0]);
    // R118 · 事件类型四段直选在横屏。约束面在竖屏（60.3 的墨位），横屏反而更宽（62.3），
    // 所以横屏这条判的是「同一套规则在另一个方向也真的挂上了」，不是重新证明放得下。
    // 横屏的 .filters 平时藏在 filters-open 后面（styles.css 4477）—— 量之前先把它开起来，量完还原。
    const lSidebar = document.querySelector('.sidebar');
    const lHadFilters = lSidebar.classList.contains('filters-open');
    const lWasCollapsed = lSidebar.classList.contains('collapsed');
    if (lWasCollapsed) { viewer.toggleSidebar(true); await sleep(400); }
    if (!lHadFilters) viewer.setFiltersOpen(true, false);
    await sleep(320);
    const lRow = document.getElementById('eventTypeSegments');
    const lSel = document.getElementById('eventFilter');
    const lSegs = lRow ? [...lRow.querySelectorAll('.choice-segment')] : [];
    const lInk = (el) => { const r = document.createRange(); r.selectNodeContents(el);
        const w = r.getBoundingClientRect().width; r.detach && r.detach(); return Math.round(w * 10) / 10; };
    const lRoom = (el) => { const c = getComputedStyle(el);
        return Math.round((el.getBoundingClientRect().width
            - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight)) * 10) / 10; };
    const lBox = lRow ? lRow.getBoundingClientRect() : null;
    const lDateGroup = document.querySelector('.filter-date-group');
    const lDateChips = document.getElementById('dateChips');
    const lCal = document.getElementById('filterCalendarBtn');
    const lStack = document.querySelector('.filter-stack')?.getBoundingClientRect();
    const lDrawer = lSidebar.getBoundingClientRect();
    const lClip = lSegs.filter(s => lInk(s) > lRoom(s) + 0.5 || s.scrollWidth > s.clientWidth + 1);
    const lMinTap = 40 - 0.5 / devicePixelRatio;
    const lBorder = lSegs.map(s => { const c = getComputedStyle(s);
        return Math.max(parseFloat(c.borderTopWidth), parseFloat(c.borderLeftWidth)); });
    const lAppr = lSegs.map(s => getComputedStyle(s).webkitAppearance || getComputedStyle(s).appearance);
    ok('横屏也挂上了：轨道有盒、每段整字、段够点、没有浏览器默认框（R118）',
        !!lBox && lBox.width > 40 && lSegs.length === 4 && lClip.length === 0
        && lSegs.every(s => /^1 1 0px$/.test(getComputedStyle(s).flex))
        && lSegs.every(s => s.getBoundingClientRect().height >= lMinTap)
        && lBorder.every(w => w === 0) && lAppr.every(a => a === 'none'),
        `轨=${lBox ? Math.round(lBox.width * 10) / 10 + '×' + Math.round(lBox.height * 10) / 10 : 'ABSENT'} `
        + `被切=${lClip.length}/4 框宽=${[...new Set(lBorder)].join(',')} appearance=${[...new Set(lAppr)].join(',')}`);
    // R171 取代 R164 的浮卡：横屏筛选是从抽屉右缘折出的整面，日期输入让位给 chips + 日历。
    ok('横屏筛选 = 抽屉右侧整面（R171）',
        !!lStack && Math.abs(lStack.width - 340) <= 1
        && Math.abs(lStack.left + parseFloat(getComputedStyle(document.querySelector('.filter-stack')).borderLeftWidth) - lDrawer.right) <= 1.2
        && Math.abs(lStack.height - lDrawer.height) <= 1,
        `sheet=${lStack ? Math.round(lStack.width) + '×' + Math.round(lStack.height) : 'ABSENT'} drawer.right=${Math.round(lDrawer.right)}`);
    ok('横屏日期控制 = chips + 日历，输入框让位（R171）',
        lDateGroup && getComputedStyle(lDateGroup).display === 'none'
        && lDateChips && lDateChips.getBoundingClientRect().width > 100
        && lCal && lCal.getBoundingClientRect().width >= 39.5
        && lSel && getComputedStyle(lSel).display === 'none'
        && lBox && lBox.bottom <= lDateChips.getBoundingClientRect().top + 1,
        `dateGroup=${lDateGroup ? getComputedStyle(lDateGroup).display : '-'} chips=${lDateChips ? Math.round(lDateChips.getBoundingClientRect().width) : '-'} cal=${lCal ? Math.round(lCal.getBoundingClientRect().width) : '-'} select=${lSel ? getComputedStyle(lSel).display : '-'}`);
    if (!lHadFilters) viewer.setFiltersOpen(false, false);
    if (lWasCollapsed) viewer.toggleSidebar(false);
    // R119 · 抬层与淡出同生共死，横屏走的是同一条规则，所以同一件事必须在横屏也成立。
    const zHr = document.getElementById('headerRight');
    const zHeader = document.querySelector('.main-header');
    zHr.classList.add('active');
    await sleep(400);
    const zOpen = getComputedStyle(zHeader).zIndex;
    zHr.classList.remove('active');
    // MutationObserver 是微任务：让出一拍再读，判的是「下一帧画出来之前抬层还在」。
    await sleep(0);
    const zJustAfter = getComputedStyle(zHeader).zIndex;
    await sleep(700);
    ok('横屏：摘掉 .active 那一帧抬层仍在，淡完之后还回去（R119）',
        zOpen === '1700' && zJustAfter === '1700' && getComputedStyle(zHeader).zIndex === '50',
        `开=${zOpen} 摘后同帧=${zJustAfter} 700ms 后=${getComputedStyle(zHeader).zIndex}`);
    // R120 · 一条色相、两个角色。横屏的 ⋮ 面板是另一套排版（两列 + 图标格），墨集合比竖屏大，
    // 所以「填充族变浅」这件事必须在横屏再判一次 —— 尤其是**不许有字色漏到浅紫那一档**：
    // 那正是 R114 之前白玻璃被钉成白板的通路（`#5b4bf0` 当字要材质 .881）。
    const lProbe = document.createElement('span');
    lProbe.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px';
    const lReadVar = (name) => {
        lProbe.style.background = `var(${name})`;
        document.body.appendChild(lProbe);
        const c = getComputedStyle(lProbe).backgroundColor;
        lProbe.remove();
        return c;
    };
    const L_FILL = 'rgb(91, 75, 240)';
    const lFill = lReadVar('--accent-solid'), lCta = lReadVar('--cta-fill'), lAccent = lReadVar('--accent');
    const lPanel = document.getElementById('headerActionsGroup') || document.querySelector('.header-right .header-actions-group');
    const lTextLeaks = lPanel ? [...lPanel.querySelectorAll('*')]
        .filter(n => n.textContent && n.textContent.trim() && getComputedStyle(n).color === L_FILL)
        .map(n => (n.className || n.tagName) + ' «' + n.textContent.trim().slice(0, 8) + '»') : [];
    ok('横屏：填充族两档 token 同值，且字色族没有被一起变浅（R120）',
        lFill === L_FILL && lCta === L_FILL && lAccent !== L_FILL,
        `--accent-solid=${lFill} --cta-fill=${lCta} --accent=${lAccent}`);
    ok('横屏：⋮ 面板里没有任何「字」画在浅紫那一档（漏一条就退回白板）（R120）',
        !!lPanel && lTextLeaks.length === 0,
        lPanel ? `字色=浅紫 的元素=${lTextLeaks.length}${lTextLeaks.length ? ' → ' + lTextLeaks.slice(0, 3).join(' ; ') : ''}` : '面板元素缺失');
    // R122 · 横屏的「分类」问题**测过、撤回**：去掉 `.menu-choice` 的 `order: 10` 分组立刻正确，
    // 但结构性多一行，内容 274 > 可用 250，末行被裁（这一条当时就是被「N 行仍可点」抓到的）。
    // 所以这里不判「order 必须为 0」，而是把取舍所需的三个数留在报告里，等用户拍板后再改。
    const lChoices = [...document.querySelectorAll('.header-collapsed .header-right .header-actions-group .menu-choice')];
    const lPanelEl = document.querySelector('.header-collapsed .header-right .header-actions-group');
    const lBarBox = document.querySelector('.phone-action-bar');
    out.r122Land = {
        choices: lChoices.length,
        orders: lChoices.map((n) => getComputedStyle(n).order),
        panelTop: Math.round(lPanelEl.getBoundingClientRect().top),
        barTop: Math.round(lBarBox.getBoundingClientRect().top),
        contentH: lPanelEl.scrollHeight,
        boxH: Math.round(lPanelEl.getBoundingClientRect().height),
    };
    // 只记数不判：3px 级的舍入溢出是常态，真正要守的是「每个按钮都点得到」，那是上面那条
    // 「N 行仍可点」（elementFromPoint）在管 —— 用「内容 ≤ 盒子」当判据会在舍入上天天假红。
    const lDiag = document.getElementById('diagnosticsBtn');
    if (lDiag) {
        // 横屏 7 列里它和 主题 拼一行，所以**不该**是满宽（那是竖屏的修法）。
        const dcs = getComputedStyle(lDiag);
        ok('横屏 复制诊断 没有被竖屏那条「占满整行」误伤（R122）',
            dcs.gridColumnStart !== '1', `grid-column=${dcs.gridColumnStart}/${dcs.gridColumnEnd}`);
    }
    // R138 · 导出页横屏两栏：设置区与预览并排。原来预览条占 231px，设置区被压成 38px 的缝。
    await v.showPhoneExportModal();
    await sleep(1200);
    // Frame retrieval is async; the head's short caption only gains {w}×{h} after the first frame.
    for (let i = 0; i < 12; i += 1) {
        if (document.querySelector('.pe-dock-head .pe-label')?.textContent.includes('×')) break;
        await sleep(400);
    }
    const xp = document.querySelector('.phone-export-panel');
    const xb = xp?.querySelector('.pe-body')?.getBoundingClientRect();
    const xd = xp?.querySelector('.pe-preview-dock')?.getBoundingClientRect();
    const xCols = xp ? getComputedStyle(xp).gridTemplateColumns.split(' ').filter(Boolean).map(parseFloat) : [];
    const xc = xCols.length;
    const xSplit = xCols.length === 2 ? xCols[0] / xCols[1] : 0;
    // R140 made the split 1.6:1, R141 then made it follow the **plan's aspect**: `planAspect >= 1.8`
    // takes 1:1 so a wide composite isn't shrunk by a third (script.js:26273), everything else keeps
    // 1.6. Hard-coding 1.6 here meant the same build was green on one fixture and red on the next, so
    // the expectation is read off the W×H the head itself shows and the rule is asserted as a pairing.
    const xM = (xp?.querySelector('.pe-dock-head .pe-label')?.textContent || '').match(/(\d+)\s*×\s*(\d+)/);
    const xPlan = xM ? Number(xM[1]) / Number(xM[2]) : 0;
    const xWide = !!xp && xp.classList.contains('pe-wide-preview');
    const xWant = xPlan >= 1.8 ? 1 : 1.6;
    ok('横屏导出页两栏：分栏比跟着计划比例走（R138/R140/R141，规则同 script.js:26273）',
        !!xb && !!xd && xc === 2 && xb.height >= 150 && xb.width > 300 && !!xM
        && Math.abs(xSplit - xWant) < 0.04 && xWide === (xPlan >= 1.8),
        xb && xd ? `cols=${xc} 计划比例=${xPlan.toFixed(2)} split=${xSplit.toFixed(2)}/期望${xWant.toFixed(2)} 宽幅类=${xWide ? '挂' : '不挂'} body=${Math.round(xb.width)}x${Math.round(xb.height)} dock=${Math.round(xd.width)}x${Math.round(xd.height)}` : '面板缺失');
    // R139: the preview canvas must keep its own ratio (the old rule stretched it) and the dock's
    // head (预览 + 预览帧) must sit in the lower part, not in the middle of the column.
    const xpv = xp?.querySelector('.pe-preview');
    const xpr = xpv?.getBoundingClientRect();
    const xhd = xp?.querySelector('.pe-dock-head')?.getBoundingClientRect();
    const xRatio = xpr && xpr.height ? xpr.width / xpr.height : 0;
    const xNat = xpv && xpv.height ? xpv.width / xpv.height : 0;
    ok('横屏预览按原比例放大、预览帧按钮在底部（R139）',
        !!xpr && xpr.height >= 120 && !!xhd && Math.abs(xRatio - xNat) < 0.04
        && xhd.top > xd.bottom - 80,
        xpr && xhd ? `预览=${Math.round(xpr.width)}x${Math.round(xpr.height)} 比例=${xRatio.toFixed(2)}/${xNat.toFixed(2)} `
            + `head.top=${Math.round(xhd.top)} dock.bottom=${Math.round(xd.bottom)}` : '预览缺失');
    // R140: reclaim the caption row into the head and spend the 22px of tab margins on the frame.
    // The old assertion was `width>=250 && height>=160`, which is really "the source is wide enough"
    // — the same build read 399x181 on a 2.22:1 clip and 240x181 on a 4:3 one (`r181-export-fit.js`),
    // so the red was the fixture. What R140 actually bought is the frame filling its column in at
    // least one dimension, so that is what gets asserted, relative to the dock it lives in.
    const xCap = xp?.querySelector('.pe-preview-cap');
    const xLab = xp?.querySelector('.pe-dock-head .pe-label');
    const xUsableH = xd ? Math.max(1, xd.height - 42) : 0;      // .pe-preview 的 max-height: calc(100% - 42px)
    const xFill = xpr && xd ? Math.max(xpr.width / xd.width, xpr.height / xUsableH) : 0;
    ok('横屏导出：画框吃满所在栏、说明行合进 head（R140）',
        !!xpr && xFill >= 0.85
        && !!xCap && getComputedStyle(xCap).display === 'none'
        && !!xLab && xLab.textContent.includes('×') && xLab.scrollWidth <= xLab.clientWidth + 1,
        xpr ? `预览=${Math.round(xpr.width)}x${Math.round(xpr.height)} 占栏=${xFill.toFixed(2)}（栏 ${Math.round(xd.width)}x${Math.round(xUsableH)}） cap=${xCap ? getComputedStyle(xCap).display : '-'} label="${xLab?.textContent || ''}"` : '预览缺失');
    v.hidePhoneExportModal();
    await sleep(400);
    out.geom = geom.split('\n').filter(l => /^(glass|lens|geom|gap) /.test(l));
    out.orient = `${innerWidth}x${innerHeight}@${devicePixelRatio}`;
    return out;
})()
