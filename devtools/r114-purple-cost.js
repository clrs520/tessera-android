// R114 · 谁是那一种墨：品牌紫 rgb(91,75,240) 单独把白玻璃整组要到了 .842。
// 这一支找「同色相、暗到多少就不再要厚度」，并且要求它在**普通白底/深底上仍然过 4.5**
// —— 因为这个色不只用在玻璃上，改暗不能把别处的可读性换掉。
(() => {
    const fill = [255, 255, 255];          // 白玻璃那三块面
    const inks = [[91, 75, 240]];          // 品牌紫
    const need = (bd) => solveGlassAlpha(fill, [bd, bd, bd], inks);
    const lum = (c) => 0.2126 * (c[0] / 255) + 0.7152 * (c[1] / 255) + 0.0722 * (c[2] / 255);
    const cr = (a, b) => { const l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b)); return +((l1 + 0.05) / (l2 + 0.05)).toFixed(2); };
    const base = [91, 75, 240];
    const out = { 现状: { needAt100: +need(100).toFixed(3), needAt255: +need(255).toFixed(3), onWhite: cr(base, [255, 255, 255]), onDarkPlate: cr(base, [26, 29, 40]) }, 候选: [] };
    // 沿同色相往暗走（HSL 里只压亮度，色相/饱和不动），逐档看什么时候不再要厚度。
    const toHsl = (c) => {
        const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        let h = 0; if (d) h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4);
        const l = (mx + mn) / 2; const s = d ? Math.min(1, d / (1 - Math.abs(2 * l - 1))) : 0;
        return [h * 60, s, l];
    };
    const fromHsl = ([h, s, l]) => {
        const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
        const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
        return t.map((v) => Math.round((v + m) * 255));
    };
    const [h, s, l0] = toHsl(base);
    for (let l = l0; l >= 0.18; l -= 0.02) {
        const c = fromHsl([h, s, l]);
        const n100 = +need2(c, 100), n255 = +need2(c, 255);
        out.候选.push({
            hex: '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''), luma: +lum(c).toFixed(3),
            玻璃需求_底100: n100, 玻璃需求_底255: n255,
            白底对比: cr(c, [255, 255, 255]), 深色板对比: cr(c, [26, 29, 40]), 白玻璃上对比: cr(c, [255, 255, 255]),
        });
        if (n100 <= 0.451 && n255 <= 0.451) break;
    }
    function need2(ink, bd) { return solveGlassAlpha(fill, [bd, bd, bd], [ink]); }
    out.判读 = '玻璃需求 ≤ .451 且 白底/深底对比都 ≥4.5 的那一档才是可用候选：它不再给整组加厚度，也不把别处的可读性换掉';
    return JSON.stringify(out, null, 1);
})()
