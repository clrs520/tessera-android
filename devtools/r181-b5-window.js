// R181 · B5 list-window criteria. Rewritten to drive the list only through `scrollTop`, the way a
// thumb does: the previous version called `appendListPage()` / `trimListWindow()` by hand, which is
// not the shipped path and could not see what a jump-scroll actually lands on. That makes it run
// against the old build too, so the same file is the red baseline and the green after.
//   node devtools/cdp-eval.mjs --file devtools/r181-b5-window.js      (starts; returns immediately)
//   node devtools/cdp-eval.mjs --file devtools/r181-b5-read.js        (polls; every few seconds)
// The two criteria that were red on 1.2.291 are 「深跳后视口不留空白」 and 「深跳落在指过去的那件
// 事」 — see devtools/r181-b5-trace.js for the numbers behind them.
(() => {
    if (window.__b5 && window.__b5.running) return JSON.stringify({ already: 'running' });
    window.__b5 = { running: true, t0: Math.round(performance.now()) };
    (async () => {
        const checks = [];
        const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        try {
            const v = window.viewer;
            if (!v) throw new Error('no viewer');
            const list = v.dom.fileList;
            const l = v.videoListComponent;
            if (!l) throw new Error('no videoListComponent');
            const real = v.eventGroups;
            if (!real || !real.length) throw new Error('no events loaded');

            const TOTAL = Number(window.__b5n || 3000);
            const synth = (n) => {
                const out = new Array(n);
                const base = Date.parse('2026-09-01T08:00:00Z');
                const p = (x) => String(x).padStart(2, '0');
                for (let i = 0; i < n; i += 1) {
                    const t = new Date(base - i * 60000);
                    const stamp = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}_${p(t.getHours())}-${p(t.getMinutes())}-00`;
                    out[i] = { ...real[0], eventId: `synthetic/${i}#${stamp}`, startTime: stamp, name: `S${i}` };
                }
                return out;
            };
            const rows = () => [...list.querySelectorAll('.video-card')];
            const ids = () => rows().map((r) => Number(r.dataset.listIndex)).filter(Number.isFinite);
            // Measured here rather than read off the component, so the same file runs against the
            // build that has no `listPitch()` yet — the red baseline and the green after.
            const gap = () => parseFloat(getComputedStyle(list).rowGap) || 0;
            const pitch = () => {
                const os = rows().map((r) => r.offsetTop);
                if (os.length < 3) return 0;
                return (os[os.length - 1] - os[0]) / (os.length - 1);
            };
            // Blank means "a spacer is painted where the user is looking", counted from the two
            // rects rather than from the bookkeeping — the ledger can be self-consistent and wrong.
            const blankPx = () => {
                const box = list.getBoundingClientRect();
                return [...list.querySelectorAll('.list-spacer')].reduce((sum, s) => {
                    const r = s.getBoundingClientRect();
                    return sum + Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top));
                }, 0);
            };
            const underIdx = () => {
                const top = list.getBoundingClientRect().top;
                const row = rows().find((r) => r.getBoundingClientRect().bottom > top + 4);
                return row ? Number(row.dataset.listIndex) : -1;
            };
            // A fill that runs over several frames counts as still moving; settle means two
            // identical snapshots. The peaks are sampled *while* it is settling: the defect is the
            // blank strip the user sees during the fill, and a settled-state sample cannot see it
            // (1.2.291 is blank for 4–8 frames and then looks fine).
            const peak = { blank: 0, rows: 0 };
            const settle = async (capMs) => {
                const t0 = performance.now();
                let prev = '';
                let same = 0;
                while (performance.now() - t0 < capMs) {
                    // One sample per produced frame. Sampling synchronously right after assigning
                    // `scrollTop` reads the DOM before the scroll handler has run, and reports a
                    // full-screen blank that no user ever sees — the handler runs in the same frame,
                    // before it paints.
                    await new Promise((r) => requestAnimationFrame(() => r()));
                    const blankNow = Math.round(blankPx());
                    const rowsNow = rows().length;
                    peak.blank = Math.max(peak.blank, blankNow);
                    peak.rows = Math.max(peak.rows, rowsNow);
                    const now = JSON.stringify([Math.round(list.scrollTop), l.listTop, l.listEnd,
                        rowsNow, blankNow]);
                    same = now === prev ? same + 1 : 0;
                    prev = now;
                    if (same >= 2) return Math.round(performance.now() - t0);
                }
                return -1;
            };
            const snapshot = (label) => ({ label, sy: Math.round(list.scrollTop),
                top: l.listTop, end: l.listEnd, rows: rows().length,
                blank: Math.round(blankPx()), under: underIdx(),
                sh: Math.round(list.scrollHeight) });

            v.eventGroups = synth(TOTAL);
            // Open the drawer if it is shut, never toggle it: a toggle would close an already-open
            // one and the geometry sample would then come from an off-screen list.
            if (list.getBoundingClientRect().left < -1 && typeof v.toggleSidebar === 'function') {
                v.toggleSidebar(true);
                await sleep(500);
                if (list.getBoundingClientRect().left < -1) {
                    v.toggleSidebar(false);
                    await sleep(500);
                }
            }
            list.scrollTop = 0;
            await sleep(120);
            v.filterAndRender();
            await sleep(600);
            // Precondition, asserted rather than assumed: a translated-off drawer still lays out, and
            // a leftover scroll offset from the previous run makes the first paint chase a viewport
            // the user never moved.
            check('前置：抽屉开着、起点在顶部', list.clientHeight > 200
                && list.getBoundingClientRect().left >= -1 && Math.round(list.scrollTop) === 0,
                `clientHeight=${Math.round(list.clientHeight)} left=${Math.round(list.getBoundingClientRect().left)} sy=${Math.round(list.scrollTop)}`);
            check('合成大列表后第一页先落地', rows().length >= 8 && rows().length <= 132,
                `rows=${rows().length}`);

            // Straight to the end the way a thumb does it: ask for the bottom, let the handler
            // build, ask again. A fixed-step walk was tried first and stopped after 240 rows — it
            // outran the page the handler had just appended, so it never reached the windowed state
            // the defect needs.
            const lastEvent = () => {
                const a = ids();
                return a.length ? Math.max(...a) : -1;
            };
            let walkMs = 0;
            let walked = 0;
            while (lastEvent() < TOTAL - 1 && walked++ < 120) {
                list.scrollTop = list.scrollHeight;
                walkMs += Math.max(0, await settle(4000));
            }
            list.scrollTop = list.scrollHeight;
            await settle(6000);
            const atBottom = snapshot('atBottom');
            const pitch0 = pitch();
            const cap = 300 + 120 + 60;
            check('一路滚到底，DOM 行数始终有界', atBottom.rows <= cap,
                `rows=${atBottom.rows} ≤ ${cap}（LIST_WINDOW_ROWS+SLACK+一页）`);
            check('总高度仍是整份列表（滚动条不缩水）',
                Math.abs(atBottom.sh - TOTAL * pitch0) < pitch0 * 4,
                `scrollHeight=${atBottom.sh}px，${TOTAL}×${pitch0.toFixed(1)}=${Math.round(TOTAL * pitch0)}px`);
            check('到底之后窗口停在末尾（末行就是最后一件事件）',
                lastEvent() === TOTAL - 1 && atBottom.top > 0,
                `末行=${lastEvent()} / ${TOTAL - 1}，listTop=${atBottom.top}`);
            check('滚到底没有空白（边走边补）', atBottom.blank === 0, `blank=${atBottom.blank}px`);

            const ids0 = ids();
            check('行号连续无空洞', ids0.length === rows().length
                && ids0.every((n, i) => i === 0 || n === ids0[i - 1] + 1),
                ids0.length ? `${ids0[0]}…${ids0[ids0.length - 1]} / ${ids0.length} 行` : '没有 data-list-index');
            const uniq = new Set(rows().map((r) => r.dataset.eventId)).size;
            check('没有重复行', uniq === rows().length, `${uniq} 唯一 / ${rows().length} 行`);
            check('行高一致（index↔偏移 用同一个 pitch 才成立）',
                rows().every((r) => Math.abs(r.offsetHeight + gap() - pitch0) < 1),
                `${rows().length} 行都是 ${(pitch0 - gap()).toFixed(1)}px + ${gap()}px 间距`);

            // The jump that used to break it: aim at an event in the middle of the list.
            const wantedEvent = 1350;
            const target = Math.round(wantedEvent * pitch0);
            peak.blank = 0; peak.rows = 0;
            list.scrollTop = target;
            const fillMs = await settle(8000);
            const back = snapshot('jump');
            check('深跳过程中与之后视口都不空白', peak.blank === 0 && back.blank === 0 && back.under >= 0,
                `补齐过程中最大空白 ${peak.blank}px（1.2.291 是整屏 454px × 4–8 帧），`
                + `落定后 blank=${back.blank}px，用时 ${fillMs}ms`);
            check('深跳落在指过去的那件事（不往下跑）', Math.abs(back.under - wantedEvent) <= 1,
                `顶行=${back.under}，要的是第 ${wantedEvent} 件， scrollTop ${target}→${back.sy}px `
                + `（跑出 ${back.sy - target}px ≈ ${Math.round((back.sy - target) / pitch0)} 件事件）`);
            check('补齐不把视口拖走（scrollTop 停在赋值处）', back.sy === target,
                `赋的是 ${target}px，落定 ${back.sy}px（浏览器 scroll anchoring 没关掉时每帧 +8880px）`);
            check('深跳后 DOM 行数仍有界', Math.max(peak.rows, back.rows) <= cap,
                `过程中最多 ${peak.rows} 行，落定 ${back.rows}（1.2.291 在这儿涨到 1020–1800）`);
            const ids1 = ids();
            check('补齐后行号仍连续', ids1.length === rows().length
                && ids1.every((n, i) => i === 0 || n === ids1[i - 1] + 1),
                `${ids1[0]}…${ids1[ids1.length - 1]} / ${ids1.length}`);
            // Relative to the block's own first row, so the container's padding is not in the way.
            const rowsA = rows();
            const base = rowsA[0] ? rowsA[0].offsetTop - Number(rowsA[0].dataset.listIndex) * pitch0 : 0;
            check('每行落在 index × pitch 上（补白与行高同一把尺）',
                rowsA.every((r) => Math.abs(r.offsetTop - (base + Number(r.dataset.listIndex) * pitch0)) < 1),
                `${rowsA.length} 行，最大偏差 ${rowsA.length ? Math.round(Math.max(...rowsA.map((r) => Math.abs(r.offsetTop - (base + Number(r.dataset.listIndex) * pitch0))))) : 0}px`);

            // The worst case the old shape could not answer at all: the very top.
            peak.blank = 0; peak.rows = 0;
            list.scrollTop = 0;
            const topMs = await settle(8000);
            const atTop = snapshot('atTop');
            check('跳到最顶端也不空白、不停手', atTop.blank === 0 && atTop.under === 0
                && peak.blank === 0 && peak.rows <= cap && topMs >= 0,
                `顶行=${atTop.under} blank=${atTop.blank}px rows=${atTop.rows}（过程中最多 ${peak.rows} 行、`
                + `空白 ${peak.blank}px）补齐 ${topMs}ms，-1 表示 8 秒还没停`);
            list.scrollTop = list.scrollHeight;
            await settle(8000);
            const endAgain = snapshot('atBottom2');
            check('再跳回末尾还是最后一件', lastEvent() === TOTAL - 1
                && endAgain.rows <= cap && endAgain.blank === 0,
                `末行=${lastEvent()} / ${TOTAL - 1} rows=${endAgain.rows} blank=${endAgain.blank}`);

            v.eventGroups = real;
            v.filterAndRender();
            await sleep(500);
            check('还原真列表后行数正常', rows().length >= 60 && rows().length <= 132,
                `rows=${rows().length}（一页 60 + 异步补的 EAGER 12）`);

            window.__b5 = { running: false, done: true, checks, atBottom, back, atTop, endAgain,
                pitch: Number(pitch0.toFixed(1)), walkMs,
                passing: checks.filter((c) => c.ok).length, failing: checks.filter((c) => !c.ok) };
        } catch (e) {
            window.__b5 = { running: false, done: true, err: String((e && e.stack) || e), checks };
        }
    })();
    return JSON.stringify({ started: true });
})();
