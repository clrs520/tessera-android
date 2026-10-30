// R184 · 全 CSS 扫一遍「中等明度的红」当文字色的地方 —— 这一类色在白玻璃上最容易过不了 AA。
// 第一版用 `\d+` 拆十六进制，`#ff453a` 直接被拆成 ["45","3"] ⇒ 报「一处都没有」，那是假绿。
const fs = require('fs');
const file = process.argv[2] || 'TDashcamStudio/src/styles.css';
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
const parse = (v) => {
    if (v[0] === '#') {
        let h = v.slice(1);
        if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
        if (h.length < 6) return null;
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    const n = (v.match(/[\d.]+/g) || []).map(Number);
    return n.length >= 3 ? [n[0], n[1], n[2]] : null;
};
const lum = (rgb) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.114 * f(rgb[2]); };
const W = [255, 255, 255];
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let stack = [];
const hits = [];
for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i].trim();
    for (const ch of t) { if (ch === '{') stack.push(t.replace('{', '').trim()); else if (ch === '}') stack.pop(); }
    const m = /^color:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/.exec(t);
    if (!m) continue;
    const rgb = parse(m[1].toLowerCase());
    if (!rgb) continue;
    const [r, g, b] = rgb;
    if (!(r >= 170 && r >= g + 55 && r >= b + 55 && Math.min(g, b) < 130)) continue;
    // 这支红压在 α=0.45 的白玻璃上、背后是三种亮度的画面，各是多少对比
    const at = (bd) => cr([0, 1, 2].map(() => 255 * 0.45 + bd * 0.55), rgb).toFixed(2);
    hits.push(`L${i + 1}  ${stack[stack.length - 1] || '(root)'}\n      ${t}  rgb(${rgb})  `
        + `帧30=${at(30)} 帧125=${at(125)} 帧254=${at(254)}`);
}
console.log(hits.join('\n') || 'none');
console.log(`\n共 ${hits.length} 处中等明度的红文字（4.5:1 为合格线）`);
