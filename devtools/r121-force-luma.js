// R121 · 把「白板」那一档在模拟器上逼出来，拍前后对比。
//
// 为什么要脚本化：AVD 这批 fixture 的亮端常年 90–170，够不到真机 `lum=197 → want=.92` 那一档，
// 所以「B 到底有没有把白板变回玻璃」在模拟器上一眼看不出来。这里只改**读到的底色**
// （`measureBackdropLuma` 的返回值），求解、迟滞、写变量、上色全部走 app 自己那套。
// 用法：先不带注入跑一次（得到 .92 的白板），再带注入跑一次（得到 .45 的玻璃）。
(() => {
    const LUMA = 197;
    const apply = window.__r121apply !== false;
    const old = document.getElementById('r121-demo');
    if (old) old.remove();
    if (apply) {
        const st = document.createElement('style');
        st.id = 'r121-demo';
        st.textContent = 'html.touch-ui body:not(.dark-theme) '
            + '.header-collapsed .header-actions-group .menu-divider { color: #444549 !important; }';
        document.head.appendChild(st);
    }
    window.__r121orig = window.__r121orig || measureBackdropLuma;
    measureBackdropLuma = () => ({ luma: LUMA, cells: 6 });
    // 让求解器把这一拍当「第一次解」：`solved=false` 时 ramp 直接落位，不用等 4 秒迟滞 + 一档一档退。
    glassState.solved = false;
    glassState.alpha = 0.45; glassState.plateAlpha = 0.45;
    glassState.thinGlass = 0; glassState.thinPlate = 0;
    glassState.releasingGlass = false; glassState.releasingPlate = false;
    glassState.nextSolve = 0;
    adaptGlassAlpha();
    const panel = document.getElementById('headerActionsGroup');
    return {
        injected: apply, forcedLuma: LUMA,
        alpha: +glassState.alpha.toFixed(3), want: +glassState.target.toFixed(3),
        plate: +glassState.plateAlpha.toFixed(3),
        bind: glassState.binding.glass, subAa: glassState.subAa, subAaWorst: glassState.subAaWorst,
        panelFill: getComputedStyle(panel).backgroundColor,
        dividerColor: getComputedStyle(panel.querySelector('.menu-divider')).color,
    };
})()
