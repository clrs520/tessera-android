// R113 追查：审计里 `B_plateMismatch` 又出现了（3 拍）。它比的是 glassState.plateAlpha 与面上的
// computed alpha —— 先分清到底是「状态 vs CSS 变量」不一致，还是「CSS 变量 vs 面」不一致。
(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const html = document.documentElement;
    const PL = '.metadata-panel', GL = '.phone-action-bar';
    const faceAlpha = (sel) => {
        const n = document.querySelector(sel);
        if (!n) return -2;
        const m = (getComputedStyle(n).backgroundColor.match(/[\d.]+/g) || []).map(Number);
        return m.length >= 4 ? +m[3].toFixed(4) : 1;
    };
    const varOf = (n) => +((getComputedStyle(html).getPropertyValue(n) || '-1').trim());
    const rows = [];
    for (let i = 0; i < 40; i++) {
        rows.push({
            t: i * 200,
            stP: +glassState.plateAlpha.toFixed(4), varP: varOf('--lens-alpha-plate'), fP: faceAlpha(PL),
            stG: +glassState.alpha.toFixed(4), varG: varOf('--lens-alpha'), fG: faceAlpha(GL),
            lens: document.querySelector(PL) ? document.querySelector(PL).className.slice(0, 46) : '-',
            solid: html.classList.contains('solid-material'),
        });
        await sleep(200);
    }
    const bad = rows.filter((r) => Math.abs(r.stP - r.fP) > 0.005);
    const stateVsVarP = rows.filter((r) => Math.abs(r.stP - r.varP) > 0.005);
    const varVsFaceP = rows.filter((r) => Math.abs(r.varP - r.fP) > 0.005);
    return JSON.stringify({
        n: rows.length,
        状态vs面: bad.length, 状态vs变量: stateVsVarP.length, 变量vs面: varVsFaceP.length,
        样本: bad.slice(0, 4).map((r) => `t=${r.t} 状态=${r.stP} 变量=${r.varP} 面=${r.fP} 类=${r.lens}`),
        变量样本: [...new Set(rows.map((r) => r.varP))].slice(0, 8),
        面样本: [...new Set(rows.map((r) => r.fP))].slice(0, 8),
    }, null, 1);
})()
