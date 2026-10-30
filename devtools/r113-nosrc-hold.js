// R113 · 「量不到底色」那一支到底动没动材质。
// 人造一个两头都量不到的一拍（视频返回 -1、CSS 也返回 -1），跑一次 adaptGlassAlpha()，
// 看 alpha / plateAlpha / CSS 变量沉不沉。改前：.45 → .72（真机那句「先半透明、很快变白底」）；
// 改后：一动不动，只把 luma 记成 -1。
(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const html = document.documentElement;
    const realMeasure = window.measureBackdropLuma;
    const realCss = window.measureCssBackdropLuma;
    const snap = () => ({
        a: glassState.alpha, p: glassState.plateAlpha,
        css: parseFloat(getComputedStyle(html).getPropertyValue('--lens-alpha')) || -1,
        cssP: parseFloat(getComputedStyle(html).getPropertyValue('--lens-alpha-plate')) || -1,
        src: glassState.src, luma: glassState.luma,
    });
    const out = { skipped: '', };
    if (typeof glassState !== 'object') { out.skipped = '没有 glassState（这台不是手机档 / 构建太旧）'; return JSON.stringify(out); }

    const orig = { a: glassState.alpha, p: glassState.plateAlpha, solved: glassState.solved, next: glassState.nextSolve };
    try {
        // 起点造在最薄那一档：这正是「暗画面 / 亮画面量出来后解出来的合法薄值」，
        // 也是被一次落空推厚时用户看得见的那一下。
        window.measureBackdropLuma = () => ({ luma: -1, cells: 0 });
        window.measureCssBackdropLuma = () => -1;
        const run = (label) => {
            glassState.alpha = 0.45; glassState.plateAlpha = 0.45;
            glassState.solved = true; glassState.nextSolve = 0;
            const before = snap();
            adaptGlassAlpha();
            const after = snap();
            out[label] = {
                before, after,
                moved: +(after.a - before.a).toFixed(3),
                movedPlate: +(after.p - before.p).toFixed(3),
                cssMoved: +(after.css - before.css).toFixed(3),
            };
        };
        run('noSrc');
        // 对照组：同一套桩，但只让视频量不到、CSS 量得到 —— 那一支该照常用 CSS 底色求解，不能一起堵住
        window.measureCssBackdropLuma = () => 200;
        glassState.alpha = 0.45; glassState.plateAlpha = 0.45;
        glassState.solved = true; glassState.nextSolve = 0;
        const b2 = snap(); adaptGlassAlpha(); const a2 = snap();
        out.cssFallback = { before: b2, after: a2, src: a2.src };
        // 台账里有没有 no-src 这一笔
        out.noSrcWrites = (typeof glassLedger === 'object' ? glassLedger.filter((e) => e.why === 'no-src').length : '无台账');
        out.ledgerTail = (typeof glassLedger === 'object' ? glassLedger.slice(-3).map((e) => `${e.why}/${e.dir} ${e.prev}->${e.g} src=${e.src}`) : []);
    } finally {
        window.measureBackdropLuma = realMeasure;
        window.measureCssBackdropLuma = realCss;
        glassState.alpha = orig.a; glassState.plateAlpha = orig.p;
        glassState.solved = orig.solved; glassState.nextSolve = 0;
        adaptGlassAlpha();
    }
    out.verdict = out.noSrc && Math.abs(out.noSrc.moved) < 0.001 && Math.abs(out.noSrc.cssMoved) < 0.001
        && out.noSrc.after.src === 'none' && out.noSrcWrites === 0
        ? '绿：量不到那一拍材质一动不动'
        : `红：这一拍把材质从 ${out.noSrc && out.noSrc.before.a} 挪到 ${out.noSrc && out.noSrc.after.a}（写入 ${out.noSrcWrites} 笔）`;
    return JSON.stringify(out, null, 1);
})()
