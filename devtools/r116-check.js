// R116 · 三条判据的独立跑法（同一份逻辑也进了 devtools/r102-verify.js 的 1b″ 段）。
// 先用它打在 1.2.195 上证明会红，再打在修好的包上证明绿 —— 别拿「改后没测」当「改对了」。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const px1 = (x) => Math.round(parseFloat(x) * 100) / 100;
    const v = window.viewer;
    const bar = document.getElementById('phoneActionBar');
    const act = () => px1(getComputedStyle(document.documentElement).getPropertyValue('--action-h'));
    const layout = () => (bar.offsetHeight > 0
        ? Math.round(bar.offsetHeight + Math.max(0, innerHeight - bar.offsetTop - bar.offsetHeight)) : 0);
    const was = document.body.classList.contains('sidebar-collapsed');
    const rest = layout();
    const out = [];

    document.body.classList.remove('sidebar-collapsed');
    await sleep(320);
    v.publishControlReserve?.();
    const during = { tf: getComputedStyle(bar).transform, act: act() };
    document.body.classList.toggle('sidebar-collapsed', was);
    await sleep(60);
    v.publishControlReserve?.();
    const mid = act();
    await sleep(320);
    const after = act();

    const hr = document.querySelector('.header-right');
    hr?.classList.add('active');
    // 间隙按**布局盒**算，不按 rect：这块面板收起态自己挂着 `translateY(-8px) scale(.98)`，
    // 打开时 200ms 滑到位 —— 拿 rect 量，在 AVD ~3fps 下「连续两次读数相同」根本不代表落定
    // （本轮就是这么量出 25.4px 的假红）。布局盒和 CSS 用的是同一套算术，与动画无关。
    const panel = document.querySelector('.header-collapsed .header-actions-group');
    await sleep(300);
    const isActive = !!document.querySelector('.header-right.active');
    const layoutGap = panel ? (bar.offsetTop - (panel.offsetTop + panel.offsetHeight)) : NaN;
    const cssBottom = panel ? px1(getComputedStyle(panel).bottom) : NaN;
    hr?.classList.remove('active');

    return JSON.stringify({
        dpr: devicePixelRatio, innerH: innerHeight,
        layoutRest: rest, atRest: act(),
        duringDisplace: during, midSlide: mid, afterSettle: after,
        panelOpen: isActive, panelCssBottom: cssBottom,
        panelLayoutBottom: panel ? panel.offsetTop + panel.offsetHeight : NaN,
        barLayoutTop: bar.offsetTop,
        gapLayout: layoutGap,
        gapPainted: panel ? Math.round((bar.getBoundingClientRect().top
            - panel.getBoundingClientRect().bottom) * 10) / 10 : NaN,
        verdicts: {
            '①静置声明=布局占用': Math.abs(after - rest) <= 1,
            '②挪开时量不留错值（三个时刻都=布局占用）':
                Math.abs(during.act - rest) <= 1 && Math.abs(mid - rest) <= 1 && Math.abs(after - rest) <= 1,
            '③面板与底条是 12px 间隙、不重叠': isActive && layoutGap >= 11 && layoutGap <= 13,
        },
    }, null, 1);
})();
