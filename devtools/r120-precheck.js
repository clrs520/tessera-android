// R120 · 改前预检：把这一轮的 CSS 差量注入**正在跑的** 1.2.201，立刻重跑普查。
//
// 为什么能这么注入：这一轮真正改的只有三件事 ——
//   ① 从 `body:not(.dark-theme)` 里**摘掉** `--accent-solid` 的浅色覆盖（摘掉 == 让 body 回退到
//      html 那份 #5b4bf0，所以显式写回 #5b4bf0 与删除该条逐像素等价）；
//   ② 在同一处补一条字面量 `--accent: #2210c5`（原来那句 `--accent: var(--glass-tint)` 声明在
//      `:root`，替换发生在 html，浅色覆盖根本进不去）；
//   ③ 底部条激活标签从 `color: var(--bg-button)` 改读 `color: var(--accent)`。
// 判据不看 token 的解析值（那正是这次踩的地方），只看**元素实渲出来的 color / background-color**。
(() => {
    const old = document.getElementById('r120-precheck');
    if (old) old.remove();
    const st = document.createElement('style');
    st.id = 'r120-precheck';
    st.textContent = `
        body:not(.dark-theme) { --accent-solid: #5b4bf0; --accent: #2210c5; --glass-tint: #2210c5; }
        .phone-action-bar .tab-btn.on { color: var(--accent) !important; }`;
    document.head.appendChild(st);
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px';
    const readVar = (name, host) => {
        probe.style.background = `var(${name})`;
        host.appendChild(probe);
        const c = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return c;
    };
    const FILL = 'rgb(91, 75, 240)';
    const panel = document.getElementById('headerActionsGroup')
        || document.querySelector('.header-right .header-actions-group');
    const texts = panel ? [...panel.querySelectorAll('*')]
        .filter(n => n.textContent && n.textContent.trim()) : [];
    const colorCount = new Map();
    for (const n of texts) {
        const c = getComputedStyle(n).color;
        colorCount.set(c, (colorCount.get(c) || 0) + 1);
    }
    const seg = panel ? panel.querySelector('.choice-segment.on') : null;
    const tabOn = document.querySelector('.phone-action-bar .tab-btn.on');
    const done = document.getElementById('drawerDoneBtn');
    const chip = document.querySelector('#quickFilters .date-chip.is-active')
        || document.querySelector('.date-chip.is-active');
    return {
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        tokens: {
            accentSolid_body: readVar('--accent-solid', document.body),
            ctaFill_body: readVar('--cta-fill', document.body),
            accentSolid_html: readVar('--accent-solid', document.documentElement),
            accent: readVar('--accent', document.body),
        },
        painted: {
            面板选中段底色: seg ? getComputedStyle(seg).backgroundColor : 'n/a',
            底部条激活标签字色: tabOn ? getComputedStyle(tabOn).color : 'n/a',
            抽屉完成字色: done ? getComputedStyle(done).color : 'n/a',
            日期chip底色: chip ? getComputedStyle(chip).backgroundColor : 'n/a',
        },
        // 这一条是真正的守门人：面板里不许有任何「字」画在浅紫那一档。
        panelTextsAtFillShade: [...colorCount.entries()].filter(([c]) => c === FILL),
        panelTextColorHistogram: [...colorCount.entries()].sort((a, b) => b[1] - a[1]),
    };
})()
