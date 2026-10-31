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
        return { ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), opacity: Number(cs(el).opacity) };
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

    // 筛选面的两颗动作钮在抽屉头部（index.html:139-140）：抽屉收起时它们是 0×0，
    // 「面开着」这条前置必须由抽屉真的展开来满足，不能拿隐藏的节点量。
    document.body.classList.remove('sidebar-collapsed');
    if (v.syncSidebarAria) v.syncSidebarAria();
    await sleep(600);
    const sheetAction = document.getElementById('filterResetBtn');
    faces.sheetAction = sheetAction;
    faces.sheetShown = shown(sheetAction);

    for (const [name, el, isVisible, need] of [
        ['长按菜单项（.context-item[disabled]）', faces.menu && faces.menu.querySelector('.context-item'), faces.menuShown, 'disabled'],
        ['导出页主按钮（.pe-nav-go[disabled]）', faces.peGo, faces.peShown, 'disabled'],
        ['筛选面动作（.filter-sheet-action[disabled]）', faces.sheetAction, faces.sheetShown, 'disabled'],
        ['批量删除（.batch-delete-btn:disabled）', faces.batch, faces.batchShown, 'disabled'],
    ]) {
        if (!isVisible || !el) { ok(`前置：${name} 这一面开着`, false, `${name} 没开着/没找到`); continue; }
        const before = el.disabled;
        el.disabled = true; await sleep(120);
        const o = inkOf(el);
        el.disabled = before; await sleep(120);
        const live = inkOf(el);
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
    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = v.videoControls.totalDuration || 3;
    v.peSelection.cameras = v.phoneExportCameras().slice(0, 1);
    v.peSelection.overlay = Object.assign({}, v.peSelection.overlay, { chrome: false, labels: false, watermark: false, mosaic: false });
    v.renderPhoneExportPanel(); await sleep(300);
    if (!v.phoneExportPlan().error) {
        await v.startPhoneExport();
        for (let i = 0; i < 80 && !v.peJob; i++) await sleep(150);
    }
    out.notes.pillJob = !!v.peJob;
    const bodyWasCollapsed = document.body.classList.contains('sidebar-collapsed');
    document.body.classList.add('sidebar-collapsed');
    await sleep(400);
    const targets = [
        ['导出页返回（#peCloseBtn）', document.querySelector('#phoneExportModal #peCloseBtn')],
        ['导出进行中胶囊 #exportPill', pill],
        ['手势提示关闭', document.querySelector('#phoneGestureHint button')],
        ['画格搬运柄 .pe-tile-grip', document.querySelector('.pe-tile-grip')],
    ];
    const hint = document.querySelector('#phoneGestureHint');
    if (hint && !shown(hint)) { hint.classList.add('show'); await sleep(300); }
    for (const [name, el] of targets) {
        if (!el) { out.notes[name] = '元素不存在（这一面本轮没走到）'; continue; }
        if (!shown(el)) { ok(`前置：${name} 看得见`, false, '面积 0 或不可见'); continue; }
        const r = rectOf(el);
        ok(`${name} ≥40×40`, r.w >= 40 && r.h >= 40, `${r.w}×${r.h}`);
    }
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
        html.style.setProperty('--kb-native-h', '320px'); await sleep(500);
        const atKb = probe();
        const kbToken = cs(html).getPropertyValue('--kb-h').trim();
        html.style.setProperty('--kb-native-h', ''); await sleep(200);
        ok('前置：键盘通道活着（--kb-h 里能看见写进去的键盘高）', kbToken.indexOf('320px') >= 0, `--kb-h=${kbToken}`);
        ok('键盘弹起时目录浏览器的内容底边上抬 ≥ 300px', at0 - atKb >= 300, `底边 ${at0} → ${atKb}（抬 ${at0 - atKb}px）`);
        // 上抬不许把顶部顶出屏幕：这一改是给内容加 margin-bottom，封顶仍靠它自己的 max-height。
        ok('键盘弹起时目录浏览器的顶边仍在可视区内', content.getBoundingClientRect().top >= -1,
           `top=${Math.round(content.getBoundingClientRect().top)}`);
    }
    if (v.closeAndroidFolderBrowser) v.closeAndroidFolderBrowser();
    if (v.peJob) { v.cancelPhoneExport(); for (let i = 0; i < 40 && v.peJob; i++) await sleep(300); }

    console.log(JSON.stringify(out, null, 1));
    return JSON.stringify(out);
})().catch((e) => JSON.stringify({ threw: String(e && e.message || e), stack: String((e && e.stack) || '').slice(0, 400) }));
