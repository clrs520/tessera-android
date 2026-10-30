// R116 · 「设置卡片与底部菜单栏之间的间隙偶尔不对」的取证。
// 面板的 bottom = calc(--action-h + 12px)，而 --action-h 是 JS 量的「底条高 + 底条到屏幕底」。
// 这个数只在 ResizeObserver（底条**改高度**）和 window resize 时刷新 —— 底条被 inset 挪动而高度不变时
// 它是旧的。这里把「量的数」和「真的数」并排打出来，差多少就是间隙错多少。
(() => {
    const px = (v) => Math.round(parseFloat(v) * 10) / 10;
    const cs = getComputedStyle(document.documentElement);
    const bar = document.querySelector('.phone-action-bar');
    const panel = document.querySelector('.header-collapsed .header-actions-group')
        || document.querySelector('.header-actions-group');
    const out = {};
    out.declared = {
        actionH: cs.getPropertyValue('--action-h').trim(),
        safeBottom: cs.getPropertyValue('--safe-bottom').trim(),
        kbH: cs.getPropertyValue('--kb-h').trim(),
        viewportH: cs.getPropertyValue('--viewport-h').trim(),
        controlsH: cs.getPropertyValue('--controls-h').trim(),
    };
    out.window = { innerH: innerHeight, vvH: Math.round(visualViewport?.height || 0),
        vvOffsetTop: Math.round(visualViewport?.offsetTop || 0), dpr: devicePixelRatio };
    if (bar) {
        const b = bar.getBoundingClientRect(), bc = getComputedStyle(bar);
        out.bar = { h: px(b.height), top: px(b.top), bottom: px(b.bottom),
            cssBottom: bc.bottom, gapToViewport: px(innerHeight - b.bottom),
            occupiedTruth: px(b.height + Math.max(0, innerHeight - b.bottom)) };
    } else out.bar = 'ABSENT';
    if (panel) {
        const p = panel.getBoundingClientRect(), pc = getComputedStyle(panel);
        out.panel = { top: px(p.top), bottom: px(p.bottom), h: px(p.height),
            cssBottom: pc.bottom, cssMaxH: pc.maxHeight, scrollH: panel.scrollHeight,
            overflow: panel.scrollHeight > Math.round(p.height) ? '滚动' : '不滚',
            gapToBarTop: bar ? px(bar.getBoundingClientRect().top - p.bottom) : null };
    } else out.panel = 'ABSENT（面板没开）';
    // 间隙该是多少 vs 实际多少：声明的 actionH 与真实 occupied 之差，就是间隙飘的量。
    const declared = px(out.declared.actionH || '0'), truth = out.bar?.occupiedTruth ?? 0;
    out.verdict = Math.abs(declared - truth) <= 1
        ? `间隙稳：${out.panel?.gapToBarTop}px（声明=真实=${declared}）`
        : `间隙会飘 ${(declared - truth)}px：声明 --action-h=${declared} 而真实 occupied=${truth} ⇒ 期望间隙 12 实得 ${out.panel?.gapToBarTop}`;
    return JSON.stringify(out, null, 1);
})();
