// R166 · the same three-line grid in the landscape row. Landscape has 193px of text width and a
// 56px row (52 before, +4 for breathing room): address / timestamp / kind·size all start at the
// same x, the timestamp never wraps or truncates, and a row without an address keeps the quiet
// placeholder line instead of shifting the timestamp left.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 30 && innerWidth <= innerHeight; i += 1) await sleep(400);
    const v = window.viewer;
    const sidebar = document.querySelector('.sidebar');
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const num = (x) => +Number(x).toFixed(1);
    const box = (el) => { const r = el.getBoundingClientRect(); return { t: num(r.top), b: num(r.bottom), l: num(r.left), r: num(r.right), w: num(r.width), h: num(r.height) }; };
    const cs = (el) => getComputedStyle(el);
    ok('基准：横屏', innerWidth > innerHeight, `${innerWidth}x${innerHeight}`);
    if (sidebar.classList.contains('collapsed')) {
        v.toggleSidebar(true);
        for (let i = 0; i < 30 && Math.abs(sidebar.getBoundingClientRect().left) > 0.5; i += 1) await sleep(100);
    }
    for (let i = 0; i < 40 && document.querySelectorAll('#fileList .video-card').length === 0; i += 1) await sleep(200);
    document.getElementById('fileList').scrollTop = 0;
    await sleep(400);
    const cards = Array.from(document.querySelectorAll('#fileList .video-card')).slice(0, 5);
    ok('基准：列表有足够的行', cards.length >= 3, cards.length);
    const rows = cards.map((card) => {
        const info = card.querySelector('.video-info');
        const time = card.querySelector('.video-time');
        const place = card.querySelector('.video-place');
        const when = card.querySelector('.video-when');
        const sub = card.querySelector('.video-sub');
        const empty = card.querySelector('.video-place-empty');
        return { card, info, time, place, when, sub, empty, ib: box(info), pb: box(place), wb: box(when), sb: box(sub), cb: box(card) };
    });
    ok('横屏行高 56（三行仍有呼吸）', rows.every((r) => r.cb.h >= 55 && r.cb.h <= 57), rows.map((r) => r.cb.h).join(','));
    ok('横屏也是三行栅格', rows.every((r) => cs(r.time).display === 'flex' && cs(r.time).flexDirection === 'column'),
        `${cs(rows[0].time).display}/${cs(rows[0].time).flexDirection}`);
    ok('位置与时间各占一行', rows.every((r) => cs(r.place).display === 'block' && cs(r.when).display === 'block'),
        `${cs(rows[0].place).display}/${cs(rows[0].when).display}`);
    ok('信息块没有被裁切', rows.every((r) => r.info.scrollHeight <= r.info.clientHeight + 1),
        rows.map((r) => `${r.info.scrollHeight}/${r.info.clientHeight}`).join(' '));
    const lefts = rows.flatMap((r) => [r.pb.l, r.wb.l, r.sb.l]);
    ok('三行共用同一左边缘', Math.max(...lefts) - Math.min(...lefts) <= 1, `${Math.min(...lefts)}..${Math.max(...lefts)}`);
    const offs = (idx) => {
        const vals = rows.map((r) => [r.pb, r.wb, r.sb][idx].t - r.cb.t);
        return Math.max(...vals) - Math.min(...vals);
    };
    ok('位置行同一 y', offs(0) <= 1, offs(0));
    ok('时间行同一 y', offs(1) <= 1, offs(1));
    ok('类型行同一 y', offs(2) <= 1, offs(2));
    ok('每行都是单行', rows.every((r) => r.pb.h <= 17.5 && r.wb.h <= 17.5 && r.sb.h <= 17.5),
        rows.slice(0, 2).map((r) => `${r.pb.h}/${r.wb.h}/${r.sb.h}`).join(' '));
    ok('时间没有被省略号截断', rows.every((r) => r.when.scrollWidth <= r.when.clientWidth + 1),
        rows.slice(0, 2).map((r) => `${r.when.scrollWidth}/${r.when.clientWidth}`).join(' '));
    const emptyRows = rows.filter((r) => r.place.classList.contains('is-empty'));
    ok('无位置行显示占位', emptyRows.length > 0 && emptyRows.every((r) => r.empty && cs(r.empty).display !== 'none' && r.place.innerText.trim().length > 0),
        emptyRows.length);
    ok('占位弱于正常位置', emptyRows.every((r) => Number(cs(r.place).fontWeight) <= 400 && cs(r.place).color === cs(r.sub).color),
        emptyRows.map((r) => `${cs(r.place).fontWeight}/${cs(r.place).color}`).join(' '));
    ok('有位置行的地址完整在 DOM', rows.filter((r) => !r.place.classList.contains('is-empty')).some((r) => r.place.innerText.includes(' · ')),
        rows.filter((r) => !r.place.classList.contains('is-empty')).map((r) => r.place.innerText.trim()).join(' | '));
    v.toggleSidebar(false);
    await sleep(400);
    return JSON.stringify(out);
})()
