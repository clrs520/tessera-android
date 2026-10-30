// R120 · 候选墨扫描：给定「白玻璃最厚允许到多少」，反推每一种角色墨**最浅**能到什么。
//
// 为什么不能手算：对比度对底色不是单调的（R103 记过一次），薄玻璃压在暗帧上时合成色是中灰，
// 深色墨反而要更厚；压在 197 那一档上时中灰墨又要最厚。所以「这支墨够不够浅」只能按整段
// 底色扫出来。这里扫的是 app 自己那套 `solveGlassAlpha`，同一个 composite、同一个 4.5:1。
//
// 输出按「允许的厚度上限」分组：每一档给出该档下**最浅**的可用候选。这就是给用户拍板用的
// 那张表 —— 想要浅墨，就得接受厚玻璃；想要薄玻璃，墨就得深。两条不能同时都要。
(() => {
    const LUMS = [40, 70, 100, 130, 160, 180, 197, 215, 235, 255];
    const fill = parseInk(getComputedStyle(document.querySelector('.header-collapsed .header-actions-group')
        || document.querySelector('.phone-action-bar')).backgroundColor);
    const demandOver = (ink) => {
        let worst = 0, worstAt = 0, silentFail = 0, silentAt = 0;
        for (const L of LUMS) {
            const bd = [L, L, L];
            const d = solveGlassAlpha(fill, bd, [ink]);
            if (d > worst) { worst = d; worstAt = L; }
            // 「静默失配」：这一档两头都不过 → 求解器把它当 unsavable 踢出约束，于是材质按别的墨走薄档，
            // 而这支墨其实正以 <4.5:1 画在屏幕上。这是当前设计里没人报出来的那一格。
            const crMax = contrastRatio([0, 1, 2].map((k) => fill[k] * GLASS_ALPHA_MAX + bd[k] * (1 - GLASS_ALPHA_MAX)), ink);
            const crMin = contrastRatio([0, 1, 2].map((k) => fill[k] * GLASS_ALPHA_MIN + bd[k] * (1 - GLASS_ALPHA_MIN)), ink);
            if (crMax < 4.5 && crMin < 4.5 && L > silentFail) { silentFail = L; silentAt = crMin; }
        }
        return { worst: +worst.toFixed(3), worstAt, flatWhite: +contrastRatio([255, 255, 255], ink).toFixed(2),
            onPlate: +contrastRatio([24, 24, 27], ink).toFixed(2), silent: silentAt ? +silentAt.toFixed(2) : 0 };
    };
    const ramp = (name, mk) => mk.map((v) => ({ role: name, ink: v, hex: '#' + v.map((x) => x.toString(16).padStart(2, '0')).join('') }));
    // 灰阶（分组标题 / 次要文字）与品牌紫（强调字）各扫一条，步长 12，够定档位。
    // 灰阶（分组标题 / 次要文字）与品牌紫（强调字）各扫一条，步长 8，够定档位。
    const grays = ramp('分组标题灰', Array.from({ length: 12 }, (_, i) => {
        const t = 125 - i * 8; return [t + 7, t + 8, t + 12];
    }));
    const purples = ramp('强调字（品牌紫）', Array.from({ length: 10 }, (_, i) => {
        const k = 1 - i * 0.11; // 从 #5b4bf0 往 #2210c5 方向插值
        return [Math.round(91 * (1 - k) + 34 * k), Math.round(75 * (1 - k) + 16 * k), Math.round(240 * (1 - k) + 197 * k)];
    }));
    const rows = [...grays, ...purples].map((c) => ({ ...c, ...demandOver(c.ink) }));
    return { fill: `rgb(${fill.join(',')})`, caps: [0.45, 0.55, 0.62, 0.70, 0.78, 0.92], rows };
})()
