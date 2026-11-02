// R214b 判据：设置面板里「清理残片」这一行的形态
//   ① 它是整行（宽度与「关于」一致），不再半格独行
//   ② 图标是组里同一套线性 SVG（fill:none / stroke:currentColor / stroke-width 1.7 / 21px），不是彩色 emoji
//   ③ 面板里不再有「2 栏栅格里只剩一格且不是整行」的行
// 跑法：CDP_TIMEOUT_MS=60000 ADB_SERIAL=<serial> CDP_PORT=9450 node devtools/cdp-eval.mjs --file devtools/r214-settings.js
(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const checks = [];
    const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail: String(detail) });

    const hr = document.getElementById('headerRight');
    if (hr) hr.classList.add('active');
    await sleep(650);
    const group = document.querySelector('.header-actions-group');
    const clean = document.getElementById('cleanPartsBtn');
    const about = document.getElementById('aboutBtn');
    ok('前置：面板已打开且两个按钮都在', !!group && !!clean && !!about, `group=${!!group}`);
    if (!group || !clean || !about) return { checks };

    const gw = group.getBoundingClientRect().width;
    const cw = clean.getBoundingClientRect().width;
    const aw = about.getBoundingClientRect().width;
    ok('「清理残片」是整行（与「关于」同宽 ±1 px，且 ≥ 面板宽 90%）',
        Math.abs(cw - aw) <= 1 && cw >= gw * 0.9,
        `clean=${Math.round(cw)} about=${Math.round(aw)} panel=${Math.round(gw)}`);

    // 面板展开时整块进 `.header-collapsed`，那一档图标是 17px（21px 是面板外的一档）；
    // 所以「同一套」要拿隔壁行的图标当基准比，而不是钉死 21。
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
    ok('图标不再是 emoji', !!svg && !/[\u{1F300}-\u{1FAFF}]/u.test(clean.querySelector('.btn-icon').textContent), 'svg');

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

    const red = checks.filter(c => !c.pass);
    return { verdict: `${checks.length - red.length}/${checks.length}`, red: red.map(x => `${x.name} = ${x.detail}`), rows: [...rows.entries()].map(([y, it]) => `${y}:${it.map(i => i.id).join('+')}`), checks };
})()
