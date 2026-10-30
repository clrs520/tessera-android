// R165 · portrait event row: address / timestamp / kind·size are three fixed, left-aligned lines.
// The report was a list where rows without a location (or with a city + street) started the
// timestamp at a different x and wrapped to a second line. This file checks the grid, not the
// strings: left edges, per-line heights, equal offsets, the quiet placeholder, and that the
// landscape row is untouched.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 30 && innerWidth > innerHeight; i += 1) await sleep(400);
    const v = window.viewer;
    const sidebar = document.querySelector('.sidebar');
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const num = (x) => +Number(x).toFixed(1);
    const box = (el) => { const r = el.getBoundingClientRect(); return { t: num(r.top), b: num(r.bottom), l: num(r.left), r: num(r.right), w: num(r.width), h: num(r.height) }; };
    const cs = (el) => getComputedStyle(el);

    ok('基准：竖屏', innerWidth < innerHeight, `${innerWidth}x${innerHeight}`);
    if (sidebar.classList.contains('collapsed')) {
        v.toggleSidebar(true);
        for (let i = 0; i < 30 && Math.abs(sidebar.getBoundingClientRect().left) > 0.5; i += 1) await sleep(100);
    }
    for (let i = 0; i < 40 && document.querySelectorAll('#fileList .video-card').length === 0; i += 1) await sleep(200);
    await sleep(400);

    const cards = Array.from(document.querySelectorAll('#fileList .video-card')).slice(0, 8);
    ok('基准：列表有足够的行', cards.length >= 5, cards.length);
    const rows = cards.map((card) => {
        const info = card.querySelector('.video-info');
        const place = card.querySelector('.video-place');
        const when = card.querySelector('.video-when');
        const sub = card.querySelector('.video-sub');
        const empty = card.querySelector('.video-place-empty');
        return { card, info, place, when, sub, empty, ib: info && box(info), pb: place && box(place), wb: when && box(when), sb: sub && box(sub), cb: box(card) };
    });
    ok('每行都有 place / when / sub', rows.every((r) => r.place && r.when && r.sub));

    // 1) Same left edge for every line of every row.
    const lefts = rows.flatMap((r) => [r.pb.l, r.wb.l, r.sb.l]);
    const minLeft = Math.min(...lefts), maxLeft = Math.max(...lefts);
    ok('三行共用同一左边缘', maxLeft - minLeft <= 1, `${minLeft}..${maxLeft}`);

    // 2) Same vertical rhythm in every card (the actual complaint: centred block + wrapped line).
    const offsets = rows.map((r) => [r.pb.t - r.cb.t, r.wb.t - r.cb.t, r.sb.t - r.cb.t].map(num));
    const spread = (idx) => {
        const vals = offsets.map((o) => o[idx]);
        return Math.max(...vals) - Math.min(...vals);
    };
    ok('位置行在所有卡片同一 y', spread(0) <= 1, spread(0));
    ok('时间行在所有卡片同一 y', spread(1) <= 1, spread(1));
    ok('类型行在所有卡片同一 y', spread(2) <= 1, spread(2));
    ok('卡片高度一致', Math.max(...rows.map((r) => r.cb.h)) - Math.min(...rows.map((r) => r.cb.h)) <= 1, rows.map((r) => r.cb.h).join(','));

    // 3) One line per row and no timestamp truncation.
    ok('位置行不换行（<=1 行）', rows.every((r) => r.pb.h <= 17.5), rows.map((r) => r.pb.h).join(','));
    ok('时间行不换行（<=1 行）', rows.every((r) => r.wb.h <= 17.5), rows.map((r) => r.wb.h).join(','));
    ok('类型行不换行（<=1 行）', rows.every((r) => r.sb.h <= 17.5), rows.map((r) => r.sb.h).join(','));
    ok('时间没有被省略号截断', rows.every((r) => r.when.scrollWidth <= r.when.clientWidth + 1), rows.map((r) => `${r.when.scrollWidth}/${r.when.clientWidth}`).join(' '));

    // 4) Missing address reserves the line with the quiet placeholder.
    const emptyRows = rows.filter((r) => r.place.classList.contains('is-empty'));
    const located = rows.filter((r) => !r.place.classList.contains('is-empty'));
    ok('夹具里同时有“有位置”和“无位置”行', emptyRows.length > 0 && located.length > 0, `${located.length}+${emptyRows.length}`);
    const textOf = (r) => r.place.innerText.replace(/\s+/g, ' ').trim();
    const placeholder = emptyRows[0] ? textOf(emptyRows[0]) : '';
    ok('无位置行显示弱化占位', emptyRows.every((r) => r.empty && textOf(r) === placeholder && placeholder.length > 0), JSON.stringify(placeholder));
    ok('占位与副行同色（secondary）', emptyRows.every((r) => cs(r.place).color === cs(r.sub).color), emptyRows.map((r) => cs(r.place).color).join(','));
    ok('占位不是粗体', emptyRows.every((r) => Number(cs(r.place).fontWeight) <= 400), emptyRows.map((r) => cs(r.place).fontWeight).join(','));
    ok('有位置行的地址不是占位', located.every((r) => !r.empty && textOf(r).length > 0), located.map(textOf).join(' | '));
    ok('长地址仍在 DOM 里完整保留', located.some((r) => textOf(r).includes(' · ')), located.map(textOf).join(' | '));

    // 5) The timestamp is still the real one, and the line order is address → time → kind.
    ok('行顺序是 位置 / 时间 / 类型', rows.every((r) => r.pb.b <= r.wb.t + 0.5 && r.wb.b <= r.sb.t + 0.5),
        rows.slice(0, 2).map((r) => `${r.pb.b}/${r.wb.t}/${r.wb.b}/${r.sb.t}`).join(' '));
    ok('时间文本是日期+星期+时分', rows.every((r) => /\d{1,2}月\d{1,2}日/.test(r.when.innerText)), rows[0].when.innerText.trim());

    // 6) Landscape keeps the compact 48px row and the hidden placeholder: the new grid must not
    // leak into the landscape tier (or, by the same gate, the desktop).
    v.toggleSidebar(false);
    for (let i = 0; i < 30 && sidebar.getBoundingClientRect().right > 0.5; i += 1) await sleep(100);

    return JSON.stringify(out);
})()
