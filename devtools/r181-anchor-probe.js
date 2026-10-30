// R181 · is Chrome's scroll anchoring the thing that moves `scrollTop` under the window?
// Same starting offset, same blocked fill, twice — once with the product's default anchoring and
// once with `overflow-anchor: none`. The mover is whichever run climbs.
//   node devtools/cdp-eval.mjs --file devtools/r181-anchor-probe.js
//   node devtools/cdp-eval.mjs --file devtools/r181-anchor-read.js
(() => {
    if (window.__r181anchor && window.__r181anchor.running) return JSON.stringify({ running: true });
    window.__r181anchor = { running: true };
    (async () => {
        const out = { runs: [] };
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        try {
            const v = window.viewer, list = v.dom.fileList, l = v.videoListComponent;
            if (!window.__r181real) window.__r181real = v.eventGroups;
            const real = window.__r181real;
            const TOTAL = 3000;
            const base = Date.parse('2026-09-01T08:00:00Z');
            const p = (x) => String(x).padStart(2, '0');
            const synth = () => {
                const arr = new Array(TOTAL);
                for (let i = 0; i < TOTAL; i += 1) {
                    const t = new Date(base - i * 60000);
                    const stamp = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}_${p(t.getHours())}-${p(t.getMinutes())}-00`;
                    arr[i] = { ...real[0], eventId: `synthetic/${i}#${stamp}`, startTime: stamp, name: `S${i}` };
                }
                return arr;
            };
            const START = 31520;
            const savedFill = l.scheduleWindowFill;
            for (const anchorNone of [false, true]) {
                list.style.overflowAnchor = anchorNone ? 'none' : '';
                l.scheduleWindowFill = function () { return undefined; };
                v.eventGroups = synth();
                v.filterAndRender();
                // The offset is applied after the render so both runs start from the same known
                // place: the block sits at the top, the viewport is asked for row 426.
                list.scrollTop = START;
                const trace = [];
                for (let i = 0; i < 10; i += 1) {
                    await new Promise((r) => requestAnimationFrame(() => r()));
                    trace.push([Math.round(list.scrollTop), list.querySelectorAll('.video-card').length,
                        l.listTop, l.listEnd]);
                }
                delete l.scheduleWindowFill;
                out.runs.push({ anchorNone, start: START, trace });
            }
            delete list.style.overflowAnchor;
            out.savedFillIsFn = typeof savedFill === 'function';
            v.eventGroups = real;
            v.filterAndRender();
            out.restored = real.length;
        } catch (e) {
            out.err = String((e && e.stack) || e);
        }
        window.__r181anchor = { running: false, ...out };
    })();
    return JSON.stringify({ started: true });
})();
