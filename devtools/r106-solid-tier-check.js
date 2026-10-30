// R106 · 实心档（系统「减弱透明度」/ 不支持 backdrop-filter: url() 的老 WebView）也要单行。
// R105 只改了透镜档，而那条顶部内高光写在 token `--elev-float` 里 —— 六个调用点全在实心档用得上。
// 这一版探针把「档位」写进每个快照里（前一版栽的坑：中途 playEvent 触发 markGlassMaterial() 把自己
// 手动加的 solid-material 摘掉了，于是「实心档」的后半程量的还是透镜档）。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const html = document.documentElement;
    const v = window.viewer;
    const SURF = {
        底部条: '.phone-action-bar',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        长按菜单: '.card-context-menu',
        行车数据卡片: '.metadata-panel',
        找片hero: '.player-area.empty .empty-hero',
        导出角标: '#exportPill',
    };
    const out = [];
    // 每个快照之前都做两件事：① 把材质按档位强制置位 ② 记录置位后的真实 class（不记录就等于没验证）
    const force = (solid) => {
        html.classList.toggle('solid-material', solid);
        if (!solid) window.markGlassMaterial?.();
    };
    const snap = (scr, solid) => {
        // 主题类挂在 **body** 上（`body.dark-theme`），读 documentElement 会永远报 light —— 那一版
        // 就是这个标签坏了而不是切换坏了：同一行里 `--glass-shadow` 已经从 0.22 变成 0.6（深色那份），
        // 证明切换发生了。状态标签一定要读状态真正待着的那个节点。
        const themeNow = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        for (const [n, sel] of Object.entries(SURF)) {
            const el = document.querySelector(sel);
            if (!el) continue;
            if (sel === '#exportPill') { el.classList.add('show'); el.style.display = 'flex'; }
            const st = getComputedStyle(el);
            const insets = (st.boxShadow || '').split(/,(?![^(]*\))/).filter((s) => /inset/.test(s));
            const sharp = insets.filter((s) => ((s.match(/-?[\d.]+px/g) || []).map(parseFloat)[2] ?? 9) <= 1.5);
            const bw = ['Top', 'Right', 'Bottom', 'Left'].map((k) => parseFloat(st['border' + k + 'Width']) || 0);
            out.push(`${scr}/${solid ? 'solid' : 'lens'} ${n}: solid=${html.classList.contains('solid-material') ? 1 : 0}`
                + ` theme=${themeNow}`
                + ` border=${bw.map((x) => x.toFixed(2)).join('/')}`
                + ` inset数=${sharp.length}`
                + ` shadow=${(st.boxShadow || 'none').slice(0, 44)}`);
            if (sel === '#exportPill') { el.classList.remove('show'); el.style.display = ''; }
        }
    };
    const playIfNeeded = async () => {
        if (document.querySelector('.player-area.empty')) {
            const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')))
                || (v.eventGroups || [])[0];
            await v.playEvent(ev.eventId);
            await sleep(3200);
            if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
        }
    };
    for (const solid of [false, true]) {
        force(solid);
        // 主题：走 app 自己的入口（applyTheme 收布尔），并且**当场断言真的换了**，换不过就整档作废。
        for (const mode of ['light', 'dark']) {
            localStorage.setItem('tdashcam.themeMode', mode);
            v.applyTheme(v.resolveThemeDark(mode));
            // 主题是否真的换了，看每一行自己带的 `theme=` —— 前一版探针在这里写了个复杂断言表达式，
            // 结果它自己就是错的（`mode==='dark'===class` 链式比较），读数反而没人校验。
            out.push(`—— 档位 ${solid ? 'solid' : 'lens'} / 期望主题 ${mode}`);
            force(solid);
            await playIfNeeded();
            snap(`${mode} 播放页`, solid);
            document.querySelector('.header-right')?.classList.add('active'); await sleep(700);
            force(solid);
            snap(`${mode} ⋮面板开`, solid);
            document.querySelector('.header-right')?.classList.remove('active'); await sleep(400);
            document.getElementById('headerMenuBtn')?.click(); await sleep(900);
            force(solid);
            snap(`${mode} 抽屉`, solid);
            document.getElementById('drawerDoneBtn')?.click(); await sleep(600);
        }
    }
    localStorage.setItem('tdashcam.themeMode', 'system');
    html.classList.remove('solid-material');
    window.markGlassMaterial?.();
    return JSON.stringify({ rows: out }, null, 1);
})()
