// R116c · 实验：底条被 transform 挪走时，publish() 量到的 occupied 会不会跟着错。
// `.phone-action-bar` 有 `transition: transform .22s`，抽屉/长按菜单打开时它 `translateY(14px)`。
// getBoundingClientRect() 把 transform 算进去，而 ResizeObserver 只看高度 —— 挪动不触发刷新。
// 这里不猜：直接「挪 → 量 → 放回 → 中途量 → 放回后量」，每一步都调 publishControlReserve()。
// 收尾必须把类还原，否则页面留在实验态（R102 教训）。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const px = (v) => Math.round(parseFloat(v) * 10) / 10;
    const bar = document.getElementById('phoneActionBar');
    const root = document.documentElement;
    const read = () => ({
        declared: px(getComputedStyle(root).getPropertyValue('--action-h') || '0'),
        rectBottom: px(bar.getBoundingClientRect().bottom),
        rectTop: px(bar.getBoundingClientRect().top),
        transform: getComputedStyle(bar).transform,
    });
    const pub = () => { if (window.viewer && viewer.publishControlReserve) viewer.publishControlReserve(); };
    const steps = [];
    const label = {};

    const wasSidebarCollapsed = document.body.classList.contains('sidebar-collapsed');
    const wasContextOpen = document.body.classList.contains('context-open');
    try {
        pub(); steps.push(['① 静置基线', read()]);

        // ② 底条被挪下去（抽屉态），等动画落定
        document.body.classList.remove('sidebar-collapsed');
        await sleep(400);
        steps.push(['② 抽屉开·底条挪到位', read()]);
        pub();
        steps.push(['② 挪到位后再量', read()]);

        // ③ 放回：动画中途量一次（这就是真机上「谁在 220ms 里刷了一次」的现场）
        if (wasSidebarCollapsed) document.body.classList.add('sidebar-collapsed');
        await sleep(60);
        steps.push(['③ 放回·60ms 中途', read()]);
        pub();
        steps.push(['③ 中途 publish 之后', read()]);

        // ④ 动画结束后不再 publish —— 看它停在哪（真实世界：没有第二次刷新）
        await sleep(400);
        const after = read();
        steps.push(['④ 动画落定但没人再量', after]);
        label.truth = after.rectTop;
        label.stuck = after.declared;
    } finally {
        if (wasSidebarCollapsed) document.body.classList.add('sidebar-collapsed');
        else document.body.classList.remove('sidebar-collapsed');
        if (wasContextOpen) document.body.classList.add('context-open');
        await sleep(300);
        pub();
        steps.push(['⑤ 还原并重新量', read()]);
    }
    return JSON.stringify({
        dpr: devicePixelRatio, innerH: innerHeight, steps,
        verdict: `真实 occupied 顶边=${label.truth} 而卡在=${label.stuck}px ⇒ 间隙偏 ${label.truth - label.stuck}px`,
    }, null, 1);
})();
