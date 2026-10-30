// R120 · 三个选项的后果表（离线复算，公式与 app 里的 srgbLum/contrastRatio 逐字一致）。
// 交叉校验：#2210c5 压白底必须得到 R114 记下的 10.78，#5b4bf0 配白字必须是 5.67。错了就别用这张表。
const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const cr = (a, b) => { const x = lum(...a), y = lum(...b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const comp = (fill, bd, a) => [0, 1, 2].map((k) => fill[k] * a + bd[k] * (1 - a));
const hex = (v) => '#' + v.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const checks = {
    '#2210c5 压白底（R114 记 10.78）': +cr(rgb('#2210c5'), [255, 255, 255]).toFixed(2),
    '白字压 #5b4bf0（R114 记 5.67 上下）': +cr([255, 255, 255], rgb('#5b4bf0')).toFixed(2),
    '白字压 #2210c5': +cr([255, 255, 255], rgb('#2210c5')).toFixed(2),
};
console.log('== 交叉校验 ==');
console.log(checks);

const FILL = [255, 255, 255];
const LUMS = [40, 70, 98, 130, 167, 197, 230, 255];
const INKS = {
    正文: '#1c1e21',
    分组标题灰_现值: '#6c757d',
    分组标题灰_方案B: '#444549',
    强调字_现值: '#2210c5',
    强调字_若回到品牌档: '#5b4bf0',
};
const MIN = 0.45, MAX = 0.92;
const need = (bd, ink) => {
    const c = rgb(ink);
    const ok = (a) => cr(comp(FILL, bd, a), c) >= 4.5;
    if (ok(MIN)) return MIN;
    for (let i = 1; i <= 24; i += 1) { const a = MIN + (MAX - MIN) * (i / 24); if (ok(a)) return a; }
    return null; // 救不了
};
const fmt = (v) => (v === null ? '  救不了' : v.toFixed(3).padStart(7));

console.log('\n== 每支墨在白玻璃上「自己需要的最薄档」，按底色分档 ==');
console.log('墨'.padEnd(22), LUMS.map((L) => String(L).padStart(8)).join(''));
for (const [name, ink] of Object.entries(INKS)) {
    console.log((name + ' ' + ink).padEnd(22), LUMS.map((L) => fmt(need([L, L, L], ink))).join(''));
}

console.log('\n== 三个选项的后果（每个选项按它自己那套墨来判）==');
const report = (label, alphaOf, inkSet) => {
    let stable = true, firstA = null, worstAll = 99, worstWhere = '';
    const lines = [];
    for (const L of LUMS) {
        const bd = [L, L, L];
        const a = alphaOf(bd);
        if (firstA === null) firstA = a;
        if (Math.abs(a - firstA) > 0.001) stable = false;
        for (const [name, ink] of Object.entries(inkSet)) {
            const c = cr(comp(FILL, bd, a), rgb(ink));
            if (c < worstAll) { worstAll = c; worstWhere = `${name} ${ink}@底${L}（α=${a.toFixed(3)}）`; }
        }
        lines.push(`底${L}→α${a.toFixed(3)}`);
    }
    console.log(`${label}\n  ${lines.join('  ')}\n  材质恒定=${stable ? '是（不会「变一下」）' : '否，随画面在 ' + Math.min(...LUMS.map((L) => alphaOf([L, L, L]))).toFixed(2) + '–' + Math.max(...LUMS.map((L) => alphaOf([L, L, L]))).toFixed(2) + ' 之间走'}\n  全程最弱一支墨: ${worstAll.toFixed(2)}:1 (${worstWhere}) ${worstAll >= 4.5 ? '✓ 全档过 AA' : '✗ 有档位不过 AA'}\n`);
};
const 正文组 = { 正文: '#1c1e21', 强调字: '#2210c5' };
report('A 浅色固定厚档 α=.86，分组标题继续用 #6c757d', () => 0.86,
    { ...正文组, 分组标题: '#6c757d' });
report('A′ 固定到 α=.92（自适应的上限），分组标题 #6c757d', () => 0.92,
    { ...正文组, 分组标题: '#6c757d' });
report('B 自适应 + 分组标题压到 #444549', (bd) => Math.max(
    need(bd, '#444549') ?? MIN, need(bd, '#1c1e21') ?? MIN, need(bd, '#2210c5') ?? MIN),
    { ...正文组, 分组标题: '#444549' });
report('C 现状（自适应 + 现灰 #6c757d）', (bd) => Math.max(
    need(bd, '#6c757d') ?? MIN, need(bd, '#1c1e21') ?? MIN, need(bd, '#2210c5') ?? MIN),
    { ...正文组, 分组标题: '#6c757d' });

console.log('== 分组标题灰的取舍曲线：越浅的灰，要的玻璃越厚 ==');
console.log('灰'.padEnd(10), '最厚需求'.padStart(9), '有档救不了?'.padStart(13), '白底AA?'.padStart(9));
for (let v = 125; v >= 55; v -= 8) {
    const ink = hex([v + 7, v + 8, v + 12]);
    const ds = LUMS.map((L) => need([L, L, L], ink));
    const unsavable = ds.some((d) => d === null);
    const worst = Math.max(...ds.filter((d) => d !== null));
    console.log(ink.padEnd(10), (unsavable ? '—' : worst.toFixed(3)).padStart(9),
        (unsavable ? '是（那几档静默 <4.5）' : '否').padStart(13),
        (cr(rgb(ink), FILL).toFixed(2) + (cr(rgb(ink), FILL) >= 4.5 ? ' ✓' : ' ✗')).padStart(9));
}
