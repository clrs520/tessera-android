// R203 第 5 批判据（R207）：禁用态读不读得清、焦点会不会跑到关不掉的面、够不够得着、键盘起来顶不顶得动。
// 跑法：node devtools/cdp-eval.mjs --file devtools/r207-verify.js
// 三条纪律：
//   ① 每条都要把「被量的那个面真的开着」钉成前置（`checkVisibility` + 面积 > 0），
//      面开不了就红在「前置」上，不许白捡通过 —— 这是 R182 那轮「把面开起来 ≠ 把面里的字填上」的同类坑。
//   ② 禁用态这一族在 WCAG 里是**豁免**的（1.4.3 明写 inactive controls 不受约束），所以这里断言的是
//      「读得清」（合成后的墨压在实际底上 ≥ 3:1），是一个可读性取向，不写成「AA 违规已修」。
//      浅色、深色各量一遍：`opacity: .4` 压在白底和压在深底上，可读性差得不是一点半点。
//   ③ 造「禁用」这件事是为了让 CSS 规则被走到：设完属性读**计算值**，读完复原。断言的对象是颜色，
//      不是我刚设的那个属性。
(async () => {
    const v = window.viewer, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [], notes: {} };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const html = document.documentElement;
    html.classList.add('touch-ui');

    const cs = (el) => getComputedStyle(el);
    const parseRgb = (s) => {
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[,\/\s]+/).filter(Boolean).map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const over = (fg, bg) => {
        const a = fg.a == null ? 1 : fg.a;
        return { r: a * fg.r + (1 - a) * bg.r, g: a * fg.g + (1 - a) * bg.g, b: a * fg.b + (1 - a) * bg.b, a: 1 };
    };
    // 元素自己的 opacity 要**折进**颜色里才算画出来的那层墨 —— 只看 color 会假绿（R70 那轮的口径）。
    const inkOf = (el) => {
        let bg = null, p = el;
        while (p && p !== document.documentElement) {
            const c = parseRgb(cs(p).backgroundColor);
            if (c && c.a > 0) { bg = c; break; }
            p = p.parentElement;
        }
        const backdrop = bg || { r: 255, g: 255, b: 255, a: 1 };
        const fg = over(parseRgb(cs(el).color) || { r: 0, g: 0, b: 0, a: 1 }, backdrop);
        const eff = over({ ...fg, a: Number(cs(el).opacity) }, backdrop);
        const lum = (c) => {
            const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
            return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
        };
        const l1 = lum(eff), l2 = lum(backdrop);
        return { ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), opacity: Number(cs(el).opacity),
            color: cs(el).color, bg: `rgb(${Math.round(backdrop.r)},${Math.round(backdrop.g)},${Math.round(backdrop.b)})` };
    };
    const rectOf = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
    const shown = (el) => !!el && el.checkVisibility({ visibilityProperty: true, displayProperty: true })
        && rectOf(el).w > 0 && rectOf(el).h > 0;
    // 主题必须**真的翻了**才算两条各量了一遍：先前那一版浅色深色读数一模一样，就是因为只调了
    // `applyTheme(dark)` 没验类落没落 —— 同一张底量两遍不叫双主题。走产品自己的路（写偏好 + 用它
    // 的解析器），别自己 `body.classList.add('dark-theme')`：R143 记过「翻类不等于换主题」。
    const setTheme = async (dark) => {
        localStorage.setItem('tdashcam.themeMode', dark ? 'dark' : 'light');
        v.applyTheme(v.resolveThemeDark(dark ? 'dark' : 'light'));
        await sleep(500);
        const isDark = document.body.classList.contains('dark-theme');
        if (isDark !== dark) ok(`前置：主题切到${dark ? '深色' : '浅色'}真的落地`, false, `dark-theme=${isDark}`);
        return isDark === dark;
    };

    // ---- 1) 四个禁用态：面必须真开着 --------------------------------------------------------------
    const faces = {};
    // 整套判据都建在「已经扫出事件」上：冷启动的扫描是后台的，列表还没出来时长按菜单开不起来、
    // 导出计划也不成立。等它，最多 45 秒，等不到就红在前置上。
    for (let i = 0; i < 180 && !(v.eventGroups || []).length; i++) await sleep(250);
    ok('前置：本机扫到了事件（长按菜单与导出计划都要有事件才摆得出面）', (v.eventGroups || []).length > 0,
        `${(v.eventGroups || []).length} 组`);
    await v.showCardContextMenu?.call(v, (v.eventGroups || [])[0]);
    await sleep(320);
    faces.menu = document.querySelector('.card-context-menu');
    faces.menuShown = shown(faces.menu);

    await v.showPhoneExportModal(); await sleep(700);
    faces.peGo = document.querySelector('.pe-nav-go');
    faces.peShown = shown(faces.peGo);

    // 侧栏的选择态：批量删除按钮只在 select-mode 且在 DOM 里可见时量得到
    const selBtn = () => document.querySelector('.batch-delete-btn');
    if (v.setSelectionMode) v.setSelectionMode(true); else v.selectionMode = true;
    await sleep(500);
    faces.batch = selBtn();
    faces.batchShown = shown(faces.batch);

    // 筛选面那两颗动作钮**不在竖屏这一边**：整条规则（`.filter-sheet-action` 与它的 `[disabled]`）
    // 在横屏那条 @media 里（styles.css:10966），而竖屏下 `.filter-stack` 是 `display: contents`、
    // `#filterResetBtn` 实测 0×0 / checkVisibility=false（1.2.332 上量的）。
    // 留在这一份里只会得到一条「前置：这一面没开着」的红 —— 那一面本来就不该在竖屏画出来，
    // 归横屏半边（r207-landscape.js）量。
    for (const [name, el, isVisible, need] of [
        ['长按菜单项（.context-item[disabled]）', faces.menu && faces.menu.querySelector('.context-item'), faces.menuShown, 'disabled'],
        ['导出页主按钮（.pe-nav-go[disabled]）', faces.peGo, faces.peShown, 'disabled'],
        ['批量删除（.batch-delete-btn:disabled）', faces.batch, faces.batchShown, 'disabled'],
    ]) {
        if (!isVisible || !el) { ok(`前置：${name} 这一面开着`, false, `${name} 没开着/没找到`); continue; }
        const before = el.disabled;
        el.disabled = true; await sleep(120);
        const o = inkOf(el);
        // 「启用态」要**真的把它启用**再读，不是「复原成来时的样子」：这两颗钮在产品里本来就禁着
        // （没选东西 / 导出计划不成立），复原后读到的还是禁用墨 ⇒ 「禁用 ≠ 启用」红在判据自己头上
        // （1.2.332 上实测：禁用 rgb(110,115,124) / 启用 rgb(110,115,124)）。
        el.disabled = false; await sleep(120);
        if (el.disabled) { ok(`前置：${name} 能被启用（启用态对照拿得到）`, false, '设 disabled=false 后仍是禁用：状态机把它按回去了'); continue; }
        const live = inkOf(el);
        el.disabled = before;
        // 规则有没有真的挂上，看的是**计算色变了没有**（旧写法钉 opacity<1，那是旧修法的形状；
        // 换成显式禁用墨之后 opacity 就该是 1，再钉它会得到一条永远红的「前置」）。
        ok(`前置：${name} 的禁用规则确实挂上了（禁用色 ≠ 启用色）`,
            o.color !== live.color || o.opacity !== live.opacity,
            `禁用 ${o.color} / 启用 ${live.color}`);
        for (const dark of [false, true]) {
            await setTheme(dark);
            el.disabled = true; await sleep(120);
            const m = inkOf(el);
            el.disabled = before;
            ok(`${name} 在${dark ? '深色' : '浅色'}主题下读得清（合成墨 ≥3:1）`, m.ratio >= 3,
                `${m.ratio.toFixed(2)}:1（opacity=${m.opacity}）`);
        }
        await setTheme(false);
    }

    // ---- 2) aria-selected 挂在没有 role 的卡片上 --------------------------------------------------
    const cards = [...document.querySelectorAll('.video-card[aria-selected], [data-event-id][aria-selected]')];
    ok('前置：列表里有带 aria-selected 的卡片', cards.length > 0, `${cards.length} 张`);
    const homeless = cards.filter((c) => {
        const role = c.getAttribute('role');
        const parentRole = c.parentElement && c.parentElement.getAttribute('role');
        return !role && !['listbox', 'grid', 'treegrid', 'menu', 'menubar', 'tablist', 'radiogroup'].includes(parentRole);
    });
    ok('aria-selected 只挂在有 role（或 role 容器里的）元素上', homeless.length === 0,
        `${homeless.length} 张没有 role：${(homeless[0] || {}).className || ''}`);

    // ---- 3) 弹层开着时，关不掉的面要 inert --------------------------------------------------------
    const pill = document.getElementById('exportPill');
    if (pill) pill.classList.add('show');
    const meta = document.getElementById('metaDetailOverlay');
    await v.showPhoneExportModal(); await sleep(700);
    const main = document.querySelector('.main-content');
    ok('前置：弹层确实开着（.main-content 已经 inert）', main && main.inert === true,
        main ? String(main.inert) : '没有 .main-content');
    ok('弹层开着时 #metaDetailOverlay 也要 inert', meta && meta.inert === true,
        meta ? String(meta.inert) : '元素不存在');
    ok('弹层开着时 #exportPill 也要 inert', pill && pill.inert === true,
        pill ? String(pill.inert) : '元素不存在');

    // ---- 4) 触摸目标下限 ---------------------------------------------------------------------------
    // `#exportPill` 只在「有作业在跑 + 抽屉收起」时才是可见的（styles.css:6684 与 `updateExportPill`）：
    // 只往节点上挂 `.show` 类量到的是 0×0，那不是控件的尺寸，是夹具没把状态摆出来。
    // 所以这里真起一单（单路 3 s 素材，十几秒就完），量完取消。
    await v.showPhoneExportModal(); await sleep(500);
    // 起单要有 `currentEvent`（`phoneExportPlan` 第一行就是 `if (!event || !event.segments) return {error:'无元数据'}`，
    // script.js:26377）。冷启动后没播过任何事件 ⇒ 计划永远不成立 ⇒ 胶囊只能退到「量样式盒」。
    // 判据自己把前置摆出来：`playEvent(eventId)` 可能挂着不 resolve（R200 记过），所以发出去不 await，改轮询状态。
    if (!(v.currentEvent && v.currentEvent.segments) && (v.eventGroups || []).length) {
        const target = (v.eventGroups.find((g) => (g.segments || []).length) || v.eventGroups[0]);
        out.notes.pillFixture = target.eventId + '（' + (target.segments || []).length + ' 段）';
        Promise.resolve(v.playEvent(target.eventId)).catch(() => { });
        for (let i = 0; i < 60 && !(v.currentEvent && v.currentEvent.segments); i++) await sleep(250);
        out.notes.pillEvent = !!(v.currentEvent && v.currentEvent.segments);
    }
    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = v.videoControls.totalDuration || 3;
    v.peSelection.cameras = v.phoneExportCameras().slice(0, 1);
    v.peSelection.overlay = Object.assign({}, v.peSelection.overlay, { chrome: false, labels: false, watermark: false, mosaic: false });
    v.renderPhoneExportPanel(); await sleep(300);
    out.notes.planError = v.phoneExportPlan().error || null;   // 起不了单要说得出为什么，否则「量不到」会被读成「没问题」
    if (!out.notes.planError) {
        await v.startPhoneExport();
        for (let i = 0; i < 80 && !v.peJob; i++) await sleep(150);
    }
    out.notes.pillJob = !!v.peJob;
    const bodyWasCollapsed = document.body.classList.contains('sidebar-collapsed');
    const measure = (list) => {
        for (const [name, el] of list) {
            if (!el) { out.notes[name] = '元素不存在（这一面本轮没走到）'; continue; }
            if (!shown(el)) {
                // 面没摆出来时退一步量样式表算出来的盒 —— **这不是 appearance**，
                // 所以判据名字里写明是哪条路，别让两种强度混在一条绿里。
                const st = cs(el);
                const h = parseFloat(st.height) || parseFloat(st.minHeight) || 0;
                ok(`${name} ≥40（面没开起来，退量样式盒）`, h >= 40,
                    `样式高 ${h}px｜job=${out.notes.pillJob ? 'y' : 'n'}｜plan=${out.notes.planError || 'ok'}`);
                continue;
            }
            const r = rectOf(el);
            ok(`${name} ≥40×40`, r.w >= 40 && r.h >= 40, `${r.w}×${r.h}`);
        }
    };
    // 页面还开着：先量页面里的两颗（返回键、画格搬运柄）。
    document.body.classList.add('sidebar-collapsed');
    await sleep(400);
    measure([
        ['导出页返回（#peCloseBtn）', document.querySelector('#phoneExportModal #peCloseBtn')],
        ['画格搬运柄 .pe-tile-grip', document.querySelector('.pe-tile-grip')],
    ]);
    // 再收起页面量胶囊：那一页开着时胶囊被压在下面，`checkVisibility` 实测为 false（1.2.331 上
    // `job=y` 也量不到），于是这条永远只能退到样式盒。「导出在跑」时用户点的是真那颗胶囊。
    v.hidePhoneExportModal && v.hidePhoneExportModal();
    // 判据借来的前置要自己收尾：第 1 节开过长按菜单，而 `body.context-open` 会把胶囊整条 `display:none`
    // （styles.css:6698）—— 于是「有作业在跑」的胶囊量不到，只能退到样式盒（R182 同一类坑）。
    v.hideCardContextMenu && v.hideCardContextMenu();
    await sleep(600);
    const hint = document.querySelector('#phoneGestureHint');
    if (hint && !shown(hint)) { hint.classList.add('show'); await sleep(300); }
    measure([
        ['导出进行中胶囊 #exportPill', pill],
        ['手势提示关闭', document.querySelector('#phoneGestureHint button')],
    ]);
    if (!bodyWasCollapsed) document.body.classList.remove('sidebar-collapsed');

    // ---- 5) 键盘起来，目录浏览器要顶得动 ----------------------------------------------------------
    // 目录浏览器（`#androidDirModal`）原先不参与 `--kb-h`：别的抽屉有 `--sheet-bottom`，它没有。
    // 键盘高度从原生那条通道进 `--kb-native-h`，`--kb-h` 取两条里更深的那个（styles.css:15）。
    const dirModal = document.getElementById('androidDirModal');
    await v.openAndroidFolderBrowser();
    for (let i = 0; i < 40 && !shown(dirModal); i++) await sleep(200);
    ok('前置：目录浏览器开着', shown(dirModal), dirModal ? `${rectOf(dirModal.querySelector('.modal-content') || dirModal).w}×${rectOf(dirModal.querySelector('.modal-content') || dirModal).h}` : '没有元素');
    if (dirModal && shown(dirModal)) {
        const content = dirModal.querySelector('.modal-content') || dirModal.firstElementChild;
        const probe = () => Math.round(content.getBoundingClientRect().bottom);
        html.style.setProperty('--kb-native-h', '0px'); await sleep(400);
        const at0 = probe();
        html.style.setProperty('--kb-native-h', '320px'); await sleep(600);
        const atKb = probe();
        // 顶边要在**键盘还顶着**的时候量。旧写法先把 `--kb-native-h` 清掉再读 rect，读到的是复原途中
        // （这条面带 transition）的位置 —— 1.2.332 上实测把 −256 读成了 64，一条该红的前置白捡了通过。
        const topAtKb = Math.round(content.getBoundingClientRect().top);
        const hAtKb = Math.round(content.getBoundingClientRect().height);
        const kbToken = cs(html).getPropertyValue('--kb-h').trim();
        html.style.setProperty('--kb-native-h', ''); await sleep(200);
        ok('前置：键盘通道活着（--kb-h 里能看见写进去的键盘高）', kbToken.indexOf('320px') >= 0, `--kb-h=${kbToken}`);
        ok('键盘弹起时目录浏览器的内容底边上抬 ≥ 300px', at0 - atKb >= 300, `底边 ${at0} → ${atKb}（抬 ${at0 - atKb}px）`);
        // 上抬不许把顶部顶出屏幕：留白和封顶要一起按键盘高算，只加 margin 会把整块顶出去。
        ok('键盘弹起时目录浏览器的顶边仍在可视区内（键盘状态量）', topAtKb >= -1,
            `top=${topAtKb}、盒高 ${hAtKb}px、屏高 ${innerHeight}`);
    }
    if (v.closeAndroidFolderBrowser) v.closeAndroidFolderBrowser();
    if (v.peJob) { v.cancelPhoneExport(); for (let i = 0; i < 40 && v.peJob; i++) await sleep(300); }

    console.log(JSON.stringify(out, null, 1));
    return JSON.stringify(out);
})().catch((e) => JSON.stringify({ threw: String(e && e.message || e), stack: String((e && e.stack) || '').slice(0, 400) }));
