// R188 — per-scroll-frame helper costs on a windowed list.
(async () => {
    const c = window.viewer.videoListComponent;
    const el = c.container;
    if (!c.listWindowed()) return JSON.stringify({ err: 'not windowed' });
    await new Promise((r) => requestAnimationFrame(r));

    const time = (n, fn) => {
        const t = performance.now();
        for (let i = 0; i < n; i++) fn();
        return Math.round((performance.now() - t) / n * 100) / 100;
    };
    const rows = c.listRowNodes().length;
    return JSON.stringify({
        rows,
        pitchMs: time(100, () => c.listPitch()),
        viewMs: time(100, () => c.windowView()),
        spacersMs: time(100, () => c.setListSpacers()),
        rowNodesMs: time(100, () => c.listRowNodes().length),
        gapMs: time(100, () => c.listGapPx()),
        syncMs: time(50, () => c.syncListWindow()),
        qsaMs: time(100, () => el.querySelectorAll('.video-card').length),
    });
})()
