// R103 · Unit-test the alpha solver straight out of src/script.js (no device needed).
// Extracts the three pure helpers by name and evaluates them, so the table below is the shipped
// arithmetic, not a re-typed copy of it.
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../TDashcamStudio/src/script.js', import.meta.url), 'utf8');
const grab = (name) => {
    const i = src.indexOf(`function ${name}(`);
    if (i < 0) throw new Error('missing ' + name);
    let d = 0, j = src.indexOf('{', i);
    const s = j;
    for (; j < src.length; j++) {
        if (src[j] === '{') d++;
        else if (src[j] === '}') { d--; if (!d) break; }
    }
    return src.slice(i, j + 1);
};
const consts = src.match(/const GLASS_ALPHA_MIN = [^;]+;/)[0];
const { solveGlassAlpha, contrastRatio, measureCssBackdropLuma, GLASS_ALPHA_MIN, GLASS_ALPHA_MAX } =
    new Function('FAKE_GET', `${consts}
const glassState = { unsavable: 0 };
${src.match(/const parseInk = [^\n]+;/)[0]}
${src.match(/const parseAlpha = [^\n]+;/)[0]}
${grab('srgbLum')}
${grab('contrastRatio')}
${grab('glassAlphaPasses')}
${grab('solveGlassAlpha')}
${grab('glassInkConstraints')}
${grab('measureCssBackdropLuma').replace(/getComputedStyle\(/g, 'FAKE_GET(')}
return { solveGlassAlpha, contrastRatio, measureCssBackdropLuma, GLASS_ALPHA_MIN, GLASS_ALPHA_MAX };`)(
        (n) => ({ display: 'block', backgroundImage: n.backgroundImage || 'none', backgroundColor: n.backgroundColor || 'rgba(0, 0, 0, 0)' }));

const DARK_FILL = [26, 29, 40], LIGHT_FILL = [255, 255, 255];
const lightInk = [228, 230, 235], dimInk = [155, 160, 170], darkInk = [28, 28, 30];
const rows = [
    ['深色·首页页面底(实测37)', DARK_FILL, 37, [lightInk, dimInk]],
    ['深色·暗夜景(p99=20)', DARK_FILL, 20, [lightInk, dimInk]],
    ['深色·普通白天(p99=150)', DARK_FILL, 150, [lightInk, dimInk]],
    ['深色·车库白墙(p99=253)', DARK_FILL, 253, [lightInk, dimInk]],
    ['深色·纯白帧(p99=255)', DARK_FILL, 255, [lightInk, dimInk]],
    ['浅色·页面底(实测242)', LIGHT_FILL, 242, [darkInk]],
    ['浅色·暗夜景(p99=15)', LIGHT_FILL, 15, [darkInk, dimInk]],
    ['浅色·普通白天(p99=150)', LIGHT_FILL, 150, [darkInk]],
];
console.log('场景'.padEnd(30) + 'alpha   最差对比度   救不了的墨色');
for (const [name, fill, luma, inks] of rows) {
    const a = solveGlassAlpha(fill, [luma, luma, luma], inks);
    const comp = [0, 1, 2].map((k) => fill[k] * a + luma * (1 - a));
    const helpable = inks.filter((ink) => contrastRatio([fill[0] * 0.92 + luma * 0.08, fill[1] * 0.92 + luma * 0.08, fill[2] * 0.92 + luma * 0.08], ink) >= 4.5
        || contrastRatio([fill[0] * 0.45 + luma * 0.55, fill[1] * 0.45 + luma * 0.55, fill[2] * 0.45 + luma * 0.55], ink) >= 4.5);
    const worstHelp = helpable.length ? Math.min(...helpable.map((ink) => contrastRatio(comp, ink))) : 99;
    const unsaved = inks.length - helpable.length;
    console.log(name.padEnd(30) + a.toFixed(3) + '   ' + worstHelp.toFixed(2) + ':1'
        + (worstHelp >= 4.5 ? '  ✓AA(受约束的墨色) ' : '  ✗ ')
        + (unsaved ? ` ${unsaved} 种（token 自己的账，不参与求解）` : ' —'));
}
console.log('\n单调性抽查（越厚应当越安全，反过来说 alpha 越小越透）：');
for (const luma of [20, 120, 200, 253]) {
    const seq = [0.45, 0.6, 0.72, 0.92].map((a) => {
        const comp = [0, 1, 2].map((k) => DARK_FILL[k] * a + luma * (1 - a));
        return +contrastRatio(comp, dimInk).toFixed(2);
    });
    console.log(`  底色${String(luma).padStart(3)} → ${seq.join(' < ')}  ${seq.every((v, i, x) => !i || v >= x[i - 1]) ? '单调 ✓' : '非单调 ✗（所以改成线性扫）'}`);
}

// ---- measureCssBackdropLuma：祖先链按 alpha 背→前合成 -------------------------------------------
console.log('\nCSS 底色测量：');
const cases = [
    ['深色首页（hero→player 实测量）', [{ backgroundColor: 'rgba(26, 29, 40, 0.72)' }, { backgroundColor: 'rgb(36, 37, 38)' }, { backgroundColor: 'rgb(24, 25, 26)' }], 37],
    ['祖先里有渐变 → 承认量不到', [{ backgroundColor: 'rgba(26, 29, 40, 0.72)' }, { backgroundColor: 'rgba(0,0,0,0)', backgroundImage: 'linear-gradient(120deg,#123,#421)' }], -1],
    ['浅色页面底', [{ backgroundColor: 'rgba(255, 255, 255, 0.72)' }, { backgroundColor: 'rgb(242, 242, 247)' }], 243],
    ['不透明层前面的半透明纱要算进去', [{ backgroundColor: 'rgba(0,0,0,0)' }, { backgroundColor: 'rgba(255, 255, 255, 0.5)' }, { backgroundColor: 'rgb(20, 20, 20)' }], 138],
    ['整条链都透明 → 量不到', [{ backgroundColor: 'rgba(0,0,0,0)' }, { backgroundColor: 'rgba(0,0,0,0)' }], -1],
];
for (const [name, spec, want] of cases) {
    // spec[0] 是被测的那个玻璃面，往后依次是它的祖先。
    let leaf = null;
    for (const s of spec) leaf = { backgroundColor: s.backgroundColor, backgroundImage: s.backgroundImage || 'none', display: 'block', parentElement: leaf };
    const surface = (() => { let n = null; for (let i = spec.length - 1; i >= 0; i -= 1) n = { ...spec[i], backgroundImage: spec[i].backgroundImage || 'none', display: 'block', parentElement: n }; return n; })();
    void leaf;
    const got = Math.round(measureCssBackdropLuma(surface));
    console.log(`  ${name.padEnd(28)} got=${got} want=${want}  ${got === want ? '✓' : '✗'}`);
}


// ---- R107 · 两组解耦：共用一个变量 vs 各写一个 ----
// 数据卡的真实墨色集合（浅色主题下也一样是深色板）：白读数 + 那支蓝状态色。
// 白玻璃组：浅色主题用白底 + 深墨；深色主题用深底 + 浅墨。
const PLATE_FILL = [12, 12, 16];
const plateInks = [[255, 255, 255], [24, 144, 255]];
const glassCases = [
    ['浅色', LIGHT_FILL, [darkInk, dimInk]],
    ['深色', DARK_FILL, [lightInk, dimInk]],
];
console.log('\nR107 两组解耦（同一帧底色，共用一个变量 = 取 max；拆分 = 各写各的）：');
for (const L of [37, 150, 200, 253]) {
    for (const [tn, fill, inks] of glassCases) {
        const needGlass = solveGlassAlpha(fill, [L, L, L], inks);
        const needPlate = solveGlassAlpha(PLATE_FILL, [L, L, L], plateInks);
        const shared = Math.min(GLASS_ALPHA_MAX, Math.max(needGlass, needPlate));
        const drag = shared - needGlass;
        console.log(`  底色${String(L).padStart(3)} ${tn}：白玻璃自己只要 ${needGlass.toFixed(3)}，数据卡要 ${needPlate.toFixed(3)}`
            + ` → 共用时白玻璃被拖到 ${shared.toFixed(3)}（多付 ${drag.toFixed(2)}）`
            + `｜拆分后白玻璃 ${needGlass.toFixed(3)} 数据卡 ${needPlate.toFixed(3)}`);
    }
}
