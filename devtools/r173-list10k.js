// R173 · B5 measurement, take 2: what does a 10 000-event list cost *as the rows accumulate*?
// Rows are appended in 60-row pages exactly like the scroll handler does, so the numbers are the
// ones a thumb reaches, not a synthetic innerHTML() bulk insert. Rows are injected in memory: a
// real 10k-event stick is 60k files, and the scan side is already measured/capped (R157/R167).
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const real = v.eventGroups;
    if (!real.length) return JSON.stringify({ err: 'no events loaded' });
    const seed = real[0];
    const list = v.dom.fileList;
    const cards = () => list.querySelectorAll('.video-card').length;

    const longTasks = [];
    let observer = null;
    try {
        observer = new PerformanceObserver((l) => { for (const e of l.getEntries()) longTasks.push(Math.round(e.duration)); });
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

    // One screenful of scrolling at the current row count: what a frame costs once the DOM is big.
    const scrollProbe = async () => {
        const frames = [];
        list.scrollTop = list.scrollHeight - list.clientHeight;
        await sleep(120);
        for (let i = 0; i < 20; i += 1) {
            const f0 = performance.now();
            list.scrollTop -= list.clientHeight / 2;
            await new Promise((r) => requestAnimationFrame(() => r()));
            frames.push(performance.now() - f0);
        }
        return { worstFrameMs: Math.round(frames.sort((a, b) => b - a)[0]),
            medianFrameMs: Math.round(frames.sort((a, b) => a - b)[frames.length >> 1]) };
    };

    const run = async (label) => {
        const lc = () => { longTasks.length = 0; };
        const out = { label, steps: [] };
        v.eventGroups = synth(10000);
        lc();
        const t0 = performance.now();
        v.filterAndRender();
        out.firstPageMs = Math.round(performance.now() - t0);
        out.longAfterFirstPage = longTasks.length;
        lc();
        const l = v.videoListComponent;
        for (let target = 1000; target <= 10000; target += 1000) {
            const t = performance.now();
            while (l.listShown < target) l.appendListPage();
            await sleep(60);
            const row = { rows: cards(), at: target, appendMs: Math.round(performance.now() - t),
                nodes: document.getElementsByTagName('*').length,
                heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
                longTasks: longTasks.length, longMax: longTasks.length ? Math.max(...longTasks) : 0 };
            Object.assign(row, await scrollProbe());
            lc();
            out.steps.push(row);
        }
        const t1 = performance.now();
        v.dom.eventSearch.value = 'S999';
        v.filterAndRender();
        out.searchMs = Math.round(performance.now() - t1);
        out.searchRows = cards();
        v.dom.eventSearch.value = '';
        const t2 = performance.now();
        v.toggleSortOrder();
        out.sortMs = Math.round(performance.now() - t2);
        v.toggleSortOrder();
        await sleep(200);
        return out;
    };

    const res = { events: real.length, plain: await run('as shipped') };
    const style = document.createElement('style');
    style.id = 'r173-cv';
    style.textContent = '#fileList .video-card{content-visibility:auto;contain-intrinsic-size:auto 56px}';
    document.head.appendChild(style);
    res.cv = await run('content-visibility:auto');
    style.remove();

    v.eventGroups = real;
    v.filterAndRender();
    await sleep(300);
    observer?.disconnect();
    return JSON.stringify(res);
})()
