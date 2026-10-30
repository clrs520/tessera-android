// R188 #5 — fling through a 900-event window with the card counter on.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    if (!c.listWindowed()) return JSON.stringify({ err: 'not windowed', n: c.listEvents?.length });

    if (!c.__r188Place) {
        const orig = c.placeWindow.bind(c);
        c.__r188Place = { n: 0 };
        c.placeWindow = (start) => { c.__r188Place.n += 1; return orig(start); };
    }
    if (!c.__r188Cards) {
        const orig = c.createVideoCard.bind(c);
        c.__r188Cards = { n: 0 };
        c.createVideoCard = (ev) => { c.__r188Cards.n += 1; return orig(ev); };
    }
    c.__r188Place.n = 0;
    c.__r188Cards.n = 0;

    const pitch = c.windowPitch || 74;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const visibleRows = () => {
        const b = el.getBoundingClientRect();
        let seen = 0;
        for (const row of el.querySelectorAll('.video-card')) {
            const r = row.getBoundingClientRect();
            if (r.bottom > b.top + 1 && r.top < b.bottom - 1) seen += 1;
        }
        return seen;
    };

    el.scrollTop = Math.round(500 * pitch);
    await frame();
    for (let i = 0; i < 40; i++) await frame();   // let the read-ahead settle

    const stats = { frames: 0, blank: 0, gaps: [], maxRows: 0 };
    let last = performance.now();
    const sample = (run) => {
        const now = performance.now();
        const gap = now - last;
        last = now;
        stats.frames += 1;
        stats.gaps.push(Math.round(gap));
        if (run && visibleRows() === 0) stats.blank += 1;
        stats.maxRows = Math.max(stats.maxRows, c.rowsInWindow());
    };

    const t0 = performance.now();
    for (let i = 0; i < 90; i++) {
        el.scrollTop += 150;
        await frame();
        sample(true);
    }
    const flingMs = Math.round(performance.now() - t0);

    // Let the read-ahead finish and see how many rows it builds once the thumb stops.
    const cardsAtStop = c.__r188Cards.n;
    const rowsAtStop = c.rowsInWindow();
    for (let i = 0; i < 40; i++) { await frame(); sample(false); }

    const g = stats.gaps;
    const sorted = g.slice().sort((a, b) => a - b);
    return JSON.stringify({
        pitch: Math.round(pitch * 10) / 10,
        placeWindows: c.__r188Place.n,
        cardsBuilt: c.__r188Cards.n,
        cardsDuringFling: cardsAtStop,
        rowsAtStop,
        rowsAfterSettle: c.rowsInWindow(),
        flingMs,
        frames: stats.frames,
        blank: stats.blank,
        avgGap: Math.round(g.reduce((s, x) => s + x, 0) / g.length),
        p95Gap: sorted[Math.floor(sorted.length * 0.95)],
        maxGap: sorted[sorted.length - 1],
        over40: g.filter((x) => x > 40).length,
        maxRows: stats.maxRows,
        final: { st: el.scrollTop, top: c.listTop, end: c.listEnd, vis: visibleRows() },
    });
})()
