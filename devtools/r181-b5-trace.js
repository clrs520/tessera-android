// R181 · #464 measurement pass. The fix is not guessed: this file only records what the window
// does, frame by frame, after a jump-scroll back to the middle of a 3 000-event list.
// It instruments the PRE-R181 shape and its walk calls `trimListWindow()`, which 1.2.293 removed —
// so it is the evidence of what was wrong, and only runs against 1.2.291 and earlier.
//   node devtools/cdp-eval.mjs --file devtools/r181-b5-trace.js     (starts; returns immediately)
//   node devtools/cdp-eval.mjs --file devtools/r181-b5-trace-read.js (poll)
// Every frame carries (scrollTop, scrollHeight, listTop, spacerPx, rows, blank px inside the
// viewport, index of the row under the viewport top). `blank` is the user-visible defect, counted
// directly from the two rects instead of inferred from the bookkeeping.
(() => {
    if (window.__bt && window.__bt.running) return JSON.stringify({ already: 'running' });
    window.__bt = { running: true, t0: Math.round(performance.now()) };
    (async () => {
        const out = { frames: [], err: null, t0: performance.now() };
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        try {
            const v = window.viewer;
            const list = v.dom.fileList;
            const l = v.videoListComponent;
            const real = v.eventGroups;
            if (!l || !real || !real.length) throw new Error('no list / no events');

            const TOTAL = Number(window.__btn || 3000);
            const synth = (n) => {
                const arr = new Array(n);
                const base = Date.parse('2026-09-01T08:00:00Z');
                const p = (x) => String(x).padStart(2, '0');
                for (let i = 0; i < n; i += 1) {
                    const t = new Date(base - i * 60000);
                    const stamp = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}_`
                        + `${p(t.getHours())}-${p(t.getMinutes())}-00`;
                    arr[i] = { ...real[0], eventId: `synthetic/${i}#${stamp}`, startTime: stamp, name: `S${i}` };
                }
                return arr;
            };
            const rows = () => [...list.querySelectorAll('.video-card')];
            const snap = (ph) => {
                const box = list.getBoundingClientRect();
                const sp = list.querySelector('.list-spacer');
                const sr = sp ? sp.getBoundingClientRect() : null;
                const blank = sr
                    ? Math.max(0, Math.min(sr.bottom, box.bottom) - Math.max(sr.top, box.top)) : 0;
                const under = rows().find((r) => r.getBoundingClientRect().bottom > box.top + 4);
                return { ph, sy: Math.round(list.scrollTop), sh: Math.round(list.scrollHeight),
                    top: l.listTop, sp: Math.round(l.spacerPx()), rows: rows().length,
                    blank: Math.round(blank), idx: under ? Number(under.dataset.listIndex) : -1,
                    shown: l.listShown, t: Math.round(performance.now() - out.t0) };
            };
            const frames = async (n) => {
                for (let i = 0; i < n; i += 1) {
                    await new Promise((r) => requestAnimationFrame(() => r()));
                    out.frames.push(snap(out.phase));
                }
            };

            v.eventGroups = synth(TOTAL);
            v.filterAndRender();
            await sleep(500);

            // Walk to the bottom the way the shipped handler does it: append one page, trim.
            out.phase = 'walk';
            let guard = 0;
            while (l.listShown < TOTAL && guard++ < 200) {
                l.appendListPage();
                l.trimListWindow();
            }
            out.phase = 'atBottom';
            list.scrollTop = list.scrollHeight;
            await sleep(400);
            list.scrollTop = list.scrollHeight;
            await sleep(400);
            out.atBottom = snap('atBottom');

            // The jump itself: one assignment, then watch every frame until it settles.
            const target = Math.round(list.scrollHeight * 0.45);
            out.phase = 'jump';
            list.scrollTop = target;
            await sleep(150);
            out.jumpTarget = target;
            await frames(40);
            out.settled = out.frames[out.frames.length - 1];

            // One slow, real-looking scroll from there, to see whether the same gap reappears.
            out.phase = 'drag';
            list.scrollTop = Math.max(0, list.scrollTop - 900);
            await sleep(150);
            await frames(12);

            // Second jump, to a different depth — a single reproduction can be an artefact.
            out.phase = 'jump2';
            list.scrollTop = Math.round(list.scrollHeight * 0.18);
            await sleep(150);
            await frames(30);
            out.jump2Settled = out.frames[out.frames.length - 1];

            out.pitch = (() => {
                const os = rows().map((r) => r.offsetTop);
                return os.length > 1 ? (os[os.length - 1] - os[0]) / (os.length - 1) : 0;
            })();
            out.clientH = Math.round(list.clientHeight);

            v.eventGroups = real;
            v.filterAndRender();
            await sleep(400);
            out.restored = rows().length;
        } catch (e) {
            out.err = String((e && e.stack) || e);
        }
        window.__bt = { running: false, done: true, ...out };
        return JSON.stringify({ started: true });
    })().catch((e) => { window.__bt = { running: false, err: String(e) }; });
    return JSON.stringify({ started: true });
})();
