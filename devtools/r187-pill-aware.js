// R187 · 让「自带小药丸底的墨」不再替玻璃做主。
// 方案二把危险行改成浅红药丸 + 深红字（#b01e1e 是「救得了」的墨），若不改求解器，
// 暗画面上它会要求 alpha .80，把三块白玻璃一起钉厚 —— 正是方案三的代价，用户选的是方案二。
// 求解器本来就只该为「真的透过玻璃读」的墨负责，而这个判据（paintsOnGlass）运行时已经有了。
const fs = require('fs');

// ① 产品：surfaceNeed / binding 改用 glassInks
{
    const p = 'TDashcamStudio/src/script.js';
    let s = fs.readFileSync(p, 'utf8');
    const oldA = `        const group = sel === GLASS_PLATE_SURFACE ? 'plate' : 'glass';
        sets[group].push({ fill, inks, tag: SURFACE_TAGS[sel] || sel,
            glassInks: inks.filter((i) => onGlassSet.has(i.join(','))) });
        const surfaceNeed = solveGlassAlpha(fill, bd, inks);
        if (surfaceNeed > need[group]) {
            need[group] = surfaceNeed;
            const helpable = glassInkConstraints(fill, bd, inks).helpable;`;
    const newA = `        const group = sel === GLASS_PLATE_SURFACE ? 'plate' : 'glass';
        // R187: 自己压在不透明小药丸上的字（选中段的白字、危险行的深红字）不是透过玻璃读的，
        // 让它们参与求解就会为了它们把玻璃钉厚 —— 暗画面上实测要求到 .80。求解器只对
        // 「真的对着玻璃读」的墨负责；判别器 paintsOnGlass 本来就是为这件事写的。
        const glassInks = inks.filter((i) => onGlassSet.has(i.join(',')));
        sets[group].push({ fill, inks, tag: SURFACE_TAGS[sel] || sel, glassInks });
        const surfaceNeed = solveGlassAlpha(fill, bd, glassInks);
        if (surfaceNeed > need[group]) {
            need[group] = surfaceNeed;
            const helpable = glassInkConstraints(fill, bd, glassInks).helpable;`;
    if (!s.includes(oldA)) throw new Error('script anchor missing');
    fs.writeFileSync(p, s.replace(oldA, newA));
    console.log('script solver → glassInks');
}

// ② 判据：同一条口径（不然判据在暗画面上会红在一条根本不贴玻璃的墨上）
{
    const p = 'devtools/r102-verify.js';
    let s = fs.readFileSync(p, 'utf8');
    const oldB = `        const crAt = (fill, a, ink) => ratio([0, 1, 2].map((k) => fill[k] * a + gLuma * (1 - a)), ink);
        const rows = [];`;
    const newB = `        // R187 · 与产品同一口径：自己压在不透明小药丸上的字不参与「透过玻璃读」的账。
        // 少了这一条，危险行改成浅红药丸 + 深红字之后，判据会在暗画面上红在一条贴不到玻璃的墨上。
        const onGlassInks = (el, fill) => {
            const out = new Set();
            for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
                if (!n.textContent || !n.textContent.trim()) continue;
                const st = getComputedStyle(n);
                if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity === 0) continue;
                const c = ((st.color).match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
                if (c.length !== 3) continue;
                let pill = false;
                for (let q = n; q && q !== el; q = q.parentElement) {
                    const bg = getComputedStyle(q).backgroundColor;
                    const v = (bg.match(/[\\d.]+/g) || []).map(Number);
                    if (v.length < 3) continue;
                    const al = v.length >= 4 ? v[3] : 1;
                    if (al > 0.5 && v.slice(0, 3).some((x, i) => Math.abs(x - fill[i]) > 12)) { pill = true; break; }
                }
                if (!pill) out.add(c.join(','));
            }
            return [...out];
        };
        const crAt = (fill, a, ink) => ratio([0, 1, 2].map((k) => fill[k] * a + gLuma * (1 - a)), ink);
        const rows = [];`;
    if (!s.includes(oldB)) throw new Error('probe anchor 1 missing');
    s = s.replace(oldB, newB);
    const oldC = `            for (const key of inksOf(el)) {`;
    const newC = `            for (const key of onGlassInks(el, fill)) {`;
    if (!s.includes(oldC)) throw new Error('probe anchor 2 missing');
    fs.writeFileSync(p, s.replace(oldC, newC));
    console.log('probe AA criterion → on-glass inks');
}
