// R173 · B5 — the DOM window on a 10 000-event list, measured the way a thumb reaches it.
//   node devtools/cdp-eval.mjs --file devtools/r173-list-window.js
// SUPERSEDED by devtools/r181-b5-window.js, kept as the record of what R173 measured: R181 replaced
// the single top spacer with a block between two spacers and took `appendListPage` out of windowed
// lists, so the `spacerPx` / `listShown` claims below no longer describe the shipped shape. Running
// it against a build past 1.2.293 will show reds that are the probe's, not the product's.
// Rows are injected in memory (a real 10k stick is 60k files, and the scan side was measured and
// capped in R157/R167); the walk uses the product's own scroll handler. The synthetic list is
// dropped and the real folder re-rendered before the script returns, so nothing leaks into the
// 94/0 portrait baseline (the injected events are in memory only).
(async () => {
    const v = window.viewer;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v) return JSON.stringify({ pass: 0, fail: 1, checks: [{ name: 'viewer', ok: false }] });
    const real = v.eventGroups;
    if (!real.length) return JSON.stringify({ err: 'no events loaded' });
    const seed = real[0];
    const list = v.dom.fileList;
    const l = v.videoListComponent;
    const cards = () => list.querySelectorAll('.video-card').length;
    const spacer = () => list.querySelector('.list-spacer');
    const spacerPx = () => (spacer() ? Math.round(spacer().getBoundingClientRect().height) : 0);
    const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
    // Waiting on real frames would take the emulator's ~3 fps clock times 300 screens. Write the
    // scroll offset (the property the handler reads), wait for the browser's own `scroll` event,
    // and fall back to dispatching one after 60 ms — the same listener either way, so the window
    // bookkeeping under test is the product's, only the clock is not.
    const go = (top) => new Promise((resolve) => {
        let settled = false;
        const finish = (viaEvent) => {
            if (settled) return;
            settled = true;
            list.removeEventListener('scroll', onScroll);
            resolves.push(viaEvent);
            resolve();
        };
        const onScroll = () => finish(true);
        list.addEventListener('scroll', onScroll, { passive: true });
        list.scrollTop = top;
        setTimeout(() => {
            if (settled) return;
            list.dispatchEvent(new Event('scroll'));
            finish(false);
        }, 60);
    });

    const longTasks = [];
    let observer = null;
    try {
        observer = new PerformanceObserver((le) => { for (const e of le.getEntries()) longTasks.push(Math.round(e.duration)); });
        observer.observe({ entryTypes: ['longtask'] });
    } catch (e) { /* none */ }

    const synth = (n) => {
        const out = new Array(n);
        const base = Date.parse('2026-09-01T08:00:00Z');
        for (let i = 0; i < n; i += 1) {
            const t = new Date(base - i * 60000);
            const p = (x) => String(x).padStart(2, '0');
            const stamp = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}_${p(t.getHours())}-${p(t.getMinutes())}-00`;
            out[i] = { ...seed, eventId: `synthetic/${i}#${stamp}`, startTime: stamp, name: `S${i}` };
        }
        return out;
    };
    const anchor = () => {
        const top = list.getBoundingClientRect().top;
        const hit = [...list.querySelectorAll('.video-card')]
            .find((c) => c.getBoundingClientRect().bottom - top > 4);
        if (!hit) return null;
        return { id: hit.dataset.eventId, offset: Math.round(hit.getBoundingClientRect().top - top) };
    };

    const res = { fixtureEvents: real.length, layout: `${window.innerWidth}x${window.innerHeight}` };

    // ── the promise a normal stick keeps: nothing about its list changes ──────────────
    v.eventGroups = real;
    v.filterAndRender();
    await sleep(240);
    while (l.listShown < l.listEvents.length) l.appendListPage();
    await sleep(60);
    await go(list.scrollHeight);
    res.small = { events: l.listEvents.length, rows: cards(), windowed: l.listWindowed(),
        spacer: !!spacer(), listTop: l.listTop };
    check('≤600 事件的列表不进窗口（无 spacer、行一条不丢）',
        res.small.windowed === false && res.small.spacer === false && res.small.listTop === 0,
        JSON.stringify(res.small));

    // ── 10 000 events ───────────────────────────────────────────────────────────────
    // Two stages on purpose. The first few screens are driven by the product's own scroll handler,
    // because that is the path that has to be right. Then the remaining rows are appended in bulk
    // (the same `appendListPage` the handler calls) and ONE real scroll to the bottom is what runs
    // the trim — walking 10 000 rows a screen at a time through the emulator's ~3 fps frame clock
    // costs more wall time than the measurement is worth (it timed out at 400 s).
    v.eventGroups = synth(10000);
    v.filterAndRender();
    await sleep(240);
    longTasks.length = 0;
    const t0 = performance.now();
    let guard = 0;
    let lastShown = -1;
    while (l.listShown < 2000 && guard++ < 120) {
        await go(list.scrollTop + list.clientHeight);
        if (l.listShown === lastShown) { l.appendListPage(); await frame(); }
        lastShown = l.listShown;
    }
    res.byHandler = { rows: cards(), listTop: l.listTop, listShown: l.listShown,
        spacerPx: spacerPx(), windowed: l.listWindowed() };
    check('产品自己的滚动处理走到了窗口化（2 000 行后行数不再等于已加载数）',
        res.byHandler.windowed === true && res.byHandler.listShown > res.byHandler.rows,
        JSON.stringify(res.byHandler));
    while (l.listShown < 10000) l.appendListPage();
    await sleep(60);
    await go(list.scrollHeight);
    await go(list.scrollHeight);
    res.walkMs = Math.round(performance.now() - t0);
    res.atEnd = { rows: cards(), listTop: l.listTop, listShown: l.listShown, spacerPx: spacerPx(),
        nodes: document.getElementsByTagName('*').length,
        longTasks: longTasks.length, longMax: longTasks.length ? Math.max(...longTasks) : 0,
        scrollHeight: Math.round(list.scrollHeight) };
    check('DOM 行数压在窗口里（≤480 行，改前 10 000）',
        res.atEnd.rows >= 300 && res.atEnd.rows <= 480,
        `rows=${res.atEnd.rows} listTop=${res.atEnd.listTop} nodes=${res.atEnd.nodes}`);
    check('丢掉的行由 spacer 按真实高度占位',
        res.atEnd.spacerPx > res.atEnd.listTop * 20 && res.atEnd.spacerPx < res.atEnd.listTop * 120,
        `spacer=${res.atEnd.spacerPx}px / ${res.atEnd.listTop} 行（约 ${Math.round(res.atEnd.spacerPx / Math.max(1, res.atEnd.listTop))}px 每行）`);
    const firstRow = list.querySelector('.video-card');
    check('索引不错位：DOM 首行就是 listEvents[listTop]',
        !!firstRow && firstRow.dataset.eventId === l.listEvents[l.listTop]?.eventId,
        `first=${firstRow?.dataset.eventId} expect=${l.listEvents[l.listTop]?.eventId}`);
    check('走盘没有把主线程压成秒级长任务',
        res.atEnd.longMax < 350, `long=${res.atEnd.longTasks}条 max=${res.atEnd.longMax}ms wall=${res.walkMs}ms`);

    // ── a screenful of scrolling at the end of 10 000 ────────────────────────────────
    const frames = [];
    for (let i = 0; i < 24; i += 1) {
        const f0 = performance.now();
        await go(list.scrollTop - list.clientHeight / 2);
        frames.push(performance.now() - f0);
    }
    frames.sort((a, b) => a - b);
    res.scroll = { medianFrameMs: Math.round(frames[frames.length >> 1]),
        worstFrameMs: Math.round(frames[frames.length - 1]) };
    check('尾部一屏滚动的中位帧 ≤40ms（改前实测 111ms）',
        res.scroll.medianFrameMs <= 40, `median=${res.scroll.medianFrameMs}ms worst=${res.scroll.worstFrameMs}ms`);

    // ── back up: the dropped rows come home and nothing jumps ─────────────────────────
    await go(list.scrollTop + list.clientHeight * 3);
    await frame();
    const before = anchor();
    longTasks.length = 0;
    const topT0 = performance.now();
    for (let i = 0; i < 14 && l.listTop > 0; i += 1) await go(list.scrollTop - 400);
    const after = anchor();
    res.up = { listTop: l.listTop, rows: cards(), spacerPx: spacerPx(),
        anchorKept: !!before && !!after && before.id === after.id,
        driftPx: !!before && !!after ? Math.abs(after.offset - before.offset) : null,
        ms: Math.round(performance.now() - topT0), longTasks: longTasks.length,
        longMax: longTasks.length ? Math.max(...longTasks) : 0 };
    check('回滚把丢掉的行补回 DOM 并缩 spacer',
        res.up.listTop < res.atEnd.listTop && res.up.rows > res.atEnd.rows
        && res.up.spacerPx < res.atEnd.spacerPx,
        `listTop ${res.atEnd.listTop}→${res.up.listTop} rows ${res.atEnd.rows}→${res.up.rows} spacer ${res.atEnd.spacerPx}→${res.up.spacerPx}px`);
    check('视口里那一行还是它（回滚不换行）', res.up.anchorKept === true, `anchor=${res.up.anchorKept}`);
    check('那一行没被挪走（漂移 ≤2px）',
        res.up.driftPx !== null && res.up.driftPx <= 2, `drift=${res.up.driftPx}px`);
    check('补行的往返也没有秒级长任务', res.up.longMax < 350,
        `long=${res.up.longTasks}条 max=${res.up.longMax}ms wall=${res.up.ms}ms`);

    // Walking the whole 9 700-row span back to zero through the emulator's ~3 fps frame clock is
    // not the point of this criterion; what is, is that the endpoint exists: a flick to the top
    // lands on event 0 with the spacer spent. Same code path on a list small enough to prove.
    v.eventGroups = synth(1500);
    v.filterAndRender();
    await sleep(220);
    while (l.listShown < 1500) l.appendListPage();
    await sleep(40);
    await go(list.scrollHeight);
    await go(list.scrollHeight);
    res.midEnd = { listTop: l.listTop, rows: cards(), spacerPx: spacerPx() };
    for (let i = 0; i < 120 && l.listTop > 0; i += 1) await go(0);
    res.home = { listTop: l.listTop, rows: cards(), spacerPx: spacerPx(),
        firstEventId: list.querySelector('.video-card')?.dataset.eventId,
        expect: l.listEvents[0]?.eventId };
    check('一路回到顶：spacer 归零、第 0 条在 DOM 里',
        res.midEnd.listTop > 0 && res.home.listTop === 0 && res.home.spacerPx === 0
        && res.home.firstEventId === res.home.expect,
        `尾部 listTop=${res.midEnd.listTop} → ${res.home.listTop}，spacer ${res.midEnd.spacerPx}→${res.home.spacerPx}px，rows=${res.home.rows}`);

    // ── cleanup: the real folder back, so the regression suites see the fixture again ──
    v.eventGroups = real;
    v.filterAndRender();
    await sleep(400);
    observer?.disconnect();
    res.afterCleanup = { events: v.eventGroups.length, rows: cards(),
        spacer: !!spacer(), windowed: l.listWindowed() };
    check('撤掉注入的 10k 后真目录回到原样（无 spacer）',
        res.afterCleanup.rows === res.afterCleanup.events && res.afterCleanup.spacer === false,
        JSON.stringify(res.afterCleanup));

    const pass = checks.filter((c) => c.ok).length;
    return JSON.stringify({ pass, fail: checks.length - pass, checks, numbers: res }, null, 1);
})()
