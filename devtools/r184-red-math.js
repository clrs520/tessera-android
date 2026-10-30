// R184 · 「删除事件」那行红的账：白玻璃 α=.45 之下，画面亮度决定合成底，
// 而一支红不可能同时赢亮帧与暗帧 —— 这张表就是给效果图当依据的。
const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (rgb) => 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const W = [255, 255, 255];
const comp = (alpha, bd) => [0, 1, 2].map(() => W[0] * alpha + bd * (1 - alpha));

const INKS = {
    '现红 255,69,58': [255, 69, 58],
    '#D70015': [215, 0, 21],
    '#B01E1E': [176, 30, 30],
    '#8C1414': [140, 20, 20],
};
const BDS = [30, 60, 90, 125, 160, 200, 254];

console.log('白玻璃 α=0.45 压在不同亮度画面上：');
console.log('  画面亮度   合成底   ' + Object.keys(INKS).map((k) => k.padStart(12)).join(''));
for (const bd of BDS) {
    const c = comp(0.45, bd);
    console.log('  ' + String(bd).padStart(6) + '  rgb(' + Math.round(c[0]) + ') '
        + Object.values(INKS).map((i) => cr(c, i).toFixed(2).padStart(12)).join(''));
}
console.log('\n只改墨色/只加厚，能不能在全画面范围过 4.5:1：');
for (const [name, ink] of Object.entries(INKS)) {
    let worstBest = 99;
    for (const bd of BDS) {
        let m = 0;
        for (let i = 0; i <= 47; i += 1) { m = Math.max(m, cr(comp(0.45 + i * (0.92 - 0.45) / 47, bd), ink)); }
        worstBest = Math.min(worstBest, m);
    }
    console.log('  ' + name.padEnd(16) + '最坏那一帧上最好也只有 ' + worstBest.toFixed(2)
        + (worstBest >= 4.5 ? '  ✓ 救得了' : '  ✗ 救不了'));
}
console.log('\n换成自带不透明底（与画面无关）：');
const fixed = [
    ['#D70015 字 / #FFEDEC 底', [215, 0, 21], [255, 238, 236]],
    ['#B01E1E 字 / #FFEDEC 底', [176, 30, 30], [255, 238, 236]],
    ['白字 / #D70015 底', [255, 255, 255], [215, 0, 21]],
    ['#FF6961 字 / #3A0D0B 底（深色主题）', [255, 105, 97], [58, 13, 11]],
];
for (const [label, ink, bg] of fixed) {
    console.log('  ' + label.padEnd(34) + cr(bg, ink).toFixed(2) + (cr(bg, ink) >= 4.5 ? '  ✓' : '  ✗'));
}

// 真正的取舍：压暗的墨「过 AA」靠的是把玻璃钉厚，而钉厚是三块白玻璃一起付的账。
// 这一张表给每个候选墨「在这一帧亮度上需要多厚的玻璃」，>0.45 就是它开始替别人做主。
console.log('\n每支墨要钉多厚的玻璃（α 需求，档位 .45 是「什么都不钉」）：');
console.log('  画面亮度        ' + BDS.map((b) => String(b).padStart(7)).join(''));
for (const [name, ink] of Object.entries(INKS)) {
    const row = BDS.map((bd) => {
        let need = null;
        for (let i = 0; i <= 47; i += 1) {
            const a = 0.45 + i * (0.92 - 0.45) / 47;
            if (cr(comp(a, bd), ink) >= 4.5) { need = a; break; }
        }
        return (need === null ? '救不了' : need.toFixed(2)).padStart(7);
    });
    console.log('  ' + name.padEnd(15) + row.join(''));
}
console.log('\n把玻璃从 .45 钉到 .72 时，画面还剩多少（合成底 vs 帧本身）：');
for (const bd of [30, 90, 125, 200]) {
    console.log('  帧 ' + String(bd).padStart(3) + ' → α.45 合成 ' + Math.round(comp(0.45, bd)[0])
        + '｜α.72 合成 ' + Math.round(comp(0.72, bd)[0]) + '｜α.92 合成 ' + Math.round(comp(0.92, bd)[0]));
}

