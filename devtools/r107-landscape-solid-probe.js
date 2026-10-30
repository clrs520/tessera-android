// R107 横屏排查：solid-material 那一档在横屏到底生不生效。
// 竖屏套件同一条判据是绿的，横屏报「blur(22px) 还在」—— 两种成因要分清：
//   A. 类被 APP 自己摘掉了（R106 记过 markGlassMaterial 会清手加的类）；
//   B. 类还在，但横屏那条规则比 solid-material 的抑制规则更具体（层叠输）。
// 这里每次读之前都回读 className，并在类不见时立刻补一次，把 A/B 分开。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const html = document.documentElement;
    const SURF = {
        底部条: '.phone-action-bar',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        长按菜单: '.card-context-menu',
        行车数据卡片: '.metadata-panel',
        找片hero: '.player-area.empty .empty-hero'
    };
    const bf = (sel) => {
        const n = document.querySelector(sel); if (!n) return null;
        const c = getComputedStyle(n);
        return (c.backdropFilter && c.backdropFilter !== 'none' ? c.backdropFilter : c.webkitBackdropFilter) || 'none';
    };
    const read = () => Object.entries(SURF).map(([n, s]) => `${n}:${(bf(s) || 'missing').slice(0, 14)}`).join(' ');
    const out = { orient: `${innerWidth}x${innerHeight}@${devicePixelRatio}`, steps: [] };
    const push = (label) => out.steps.push(`${label} cls=${html.className.slice(0, 60)} | ${read()}`);

    push('基准(未加类)');
    html.classList.add('solid-material');
    push('加类后 0ms');
    for (let i = 1; i <= 6; i++) {
        await sleep(120);
        if (!html.classList.contains('solid-material')) html.classList.add('solid-material');
        push(`加类后 ${i * 120}ms${i === 1 ? '(补) ' : '(在) '}`);
    }
    out.fill = getComputedStyle(document.querySelector('.phone-action-bar')).backgroundColor;
    out.lensSupport = CSS.supports('backdrop-filter', 'blur(6px)');
    out.glassStateShape = typeof glassState === 'object'
        ? { alpha: glassState.alpha, plateAlpha: glassState.plateAlpha, lensLive: glassState.lensLive } : 'none';
    // 谁在动这个类：给 classList 的 add/remove/toggle 装个一次性探针，看 600ms 内有没有非本页调用的写入。
    out.writes = [];
    const raw = html.classList;
    const native = {};
    ['add', 'remove', 'toggle'].forEach((fn) => {
        native[fn] = raw[fn].bind(raw);
        raw[fn] = function (...args) {
            if (args.some((a) => String(a).includes('solid-material'))) {
                out.writes.push(`${fn}(${args.join(',')}) ← ${(new Error().stack || '').split('\n')[2].trim().slice(0, 70)}`);
            }
            return native[fn](...args);
        };
    });
    html.classList.remove('solid-material');
    await sleep(600);
    out.afterWatch = out.writes.slice(0, 6);
    ['add', 'remove', 'toggle'].forEach((fn) => { raw[fn] = native[fn].bind(raw); });
    return out;
})();
