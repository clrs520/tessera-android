// R214 → R215 判据：设置面板里「清理残片 + 关于」配成一行
//   ① 两条同一行、等宽，且都是**半格**（不是整行）
//   ② 面板里不再有「单格且不足 90% 宽」的孤行
//   ③ 图标是组里同一套线性 SVG（与「关于」比，不钉死像素档）
//   ④ 反证用户那条猜测：英文标签「Switch to English」没有把列撑宽 ——
//      语言行与亮度行仍同行等宽，且那一格的宽与「清理残片」这一格完全一致
//   ⑤ 两条的触控目标仍 ≥40
// 跑法：CDP_TIMEOUT_MS=60000 ADB_SERIAL=<serial> CDP_PORT=9450 node devtools/cdp-eval.mjs --file devtools/r215-settings.js
(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const checks = [];
    const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail: String(detail) });
    const box = el => {
        const r = el.getBoundingClientRect();
        return { l: r.left, t: r.top, w: r.width, h: r.height };
    };
    const sameRow = (a, b) => Math.abs(a.t - b.t) <= 1;

    const hr = document.getElementById('headerRight');
    if (hr) hr.classList.add('active');
    await sleep(650);
    const group = document.querySelector('.header-actions-group');
    const clean = document.getElementById('cleanPartsBtn');
    const about = document.getElementById('aboutBtn');
    const lang = document.getElementById('langToggleBtn');
    const bright = document.getElementById('brightnessRowBtn');
    ok('前置：面板已打开，四条参照元素都在', !!group && !!clean && !!about && !!lang && !!bright,
        `group=${!!group} clean=${!!clean} about=${!!about} lang=${!!lang} bright=${!!bright}`);
    if (!group || !clean || !about || !lang || !bright) return { checks };

    const gw = box(group).w;
    const c = box(clean), a = box(about), l = box(lang), b = box(bright);
    const half = gw * 0.5 - 2;   // 两栏之间的 gap 是 4px

    ok('「清理残片」与「关于」同一行（top 差 ≤1 px）', sameRow(c, a), `clean.t=${c.t.toFixed(1)} about.t=${a.t.toFixed(1)}`);
    ok('两条等宽（±1 px）且都是**半格**（≤ 面板 55%）',
        Math.abs(c.w - a.w) <= 1 && c.w <= gw * 0.55 && c.w >= half - 2,
        `clean=${c.w.toFixed(1)} about=${a.w.toFixed(1)} panel=${gw.toFixed(1)} 半格应为≈${half.toFixed(1)}`);

    // 这一条就是「不是被英文标签挤的」的证据：列宽由 `repeat(2, minmax(0,1fr))` 定，
    // 与内容无关 ⇒ 语言那一格必须和清理残片那一格同宽。
    ok('语言行与亮度行仍同行等宽（英文标签没把列撑宽）',
        sameRow(l, b) && Math.abs(l.w - b.w) <= 1,
        `lang=${l.w.toFixed(1)}@${l.t.toFixed(1)} bright=${b.w.toFixed(1)}@${b.t.toFixed(1)}`);
    ok('语言那一格 = 清理残片那一格（同一套等分列）',
        Math.abs(l.w - c.w) <= 1, `lang=${l.w.toFixed(1)} clean=${c.w.toFixed(1)}`);

    const svg = clean.querySelector('.btn-icon svg');
    const refSvg = about.querySelector('.btn-icon svg');
    const cs = svg ? getComputedStyle(svg) : null;
    const refCs = refSvg ? getComputedStyle(refSvg) : null;
    const sw = svg ? Math.round(svg.getBoundingClientRect().width * 10) / 10 : 0;
    const refW = refSvg ? Math.round(refSvg.getBoundingClientRect().width * 10) / 10 : 0;
    ok('图标是组里同一套线性 SVG（fill/stroke/线宽/尺寸都与「关于」一致）',
        !!svg && !!refSvg && cs.fill === 'none' && cs.strokeWidth === '1.7px'
            && cs.stroke === refCs.stroke && sw === refW,
        svg ? `fill=${cs.fill} stroke=${cs.stroke} w=${cs.strokeWidth} box=${sw} ref=${refW}` : 'no svg');
    ok('图标不是 emoji', !!svg && !/[\u{1F300}-\u{1FAFF}]/u.test(clean.querySelector('.btn-icon').textContent), 'svg');

    ok('两条的触控目标仍 ≥40 px 高', c.h >= 39.5 && a.h >= 39.5, `clean=${c.h.toFixed(1)} about=${a.h.toFixed(1)}`);

    // 按 y 分组数每行几项；允许「整行」的单格（宽 ≥90%）单独成行。
    const kids = [...group.children].filter(e => e.offsetParent !== null);
    const rows = new Map();
    kids.forEach(e => {
        const r = e.getBoundingClientRect();
        const key = Math.round(r.top / 5) * 5;
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push({ id: e.id || String(e.className).slice(0, 10), w: r.width });
    });
    const lonely = [];
    rows.forEach((items, y) => {
        if (items.length === 1 && items[0].w < gw * 0.9) lonely.push(`${items[0].id}@${y}`);
    });
    ok('没有「半格独行」的行（单格行必须整行宽）', lonely.length === 0, lonely.join(',') || `rows=${rows.size}`);

    const red = checks.filter(x => !x.pass);
    return {
        verdict: `${checks.length - red.length}/${checks.length}`,
        red: red.map(x => `${x.name} = ${x.detail}`),
        rows: [...rows.entries()].map(([y, it]) => `${y}:${it.map(i => i.id).join('+')}`),
        checks
    };
})()
