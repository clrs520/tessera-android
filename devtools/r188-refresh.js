// R188 #3 — pull-refresh of a complete list must not re-render per batch and must keep the position.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    const path = v.lastScannedPath;
    if (!path) return JSON.stringify({ err: 'no path' });
    const frame = () => new Promise((r) => requestAnimationFrame(r));

    // Park deep and remember what is on screen.
    if (c.listWindowed()) {
        el.scrollTop = Math.round(400 * (c.windowPitch || 74));
        for (let i = 0; i < 30; i++) await frame();
    }
    const visible = () => {
        const b = el.getBoundingClientRect();
        const ids = [];
        for (const row of el.querySelectorAll('.video-card')) {
            const r = row.getBoundingClientRect();
            if (r.bottom > b.top + 1 && r.top < b.bottom - 1) ids.push(row.dataset.eventId);
        }
        return ids;
    };
    const before = { st: el.scrollTop, visible: visible(), events: v.eventGroups.length, rows: c.listRowNodes().length };

    // Count renders while the refresh runs.
    let renders = 0;
    if (!c.__r188RenderCount) {
        c.__r188RenderCount = { n: 0 };
        const orig = c.render.bind(c);
        c.render = (ev, o) => { c.__r188RenderCount.n += 1; return orig(ev, o); };
    }
    c.__r188RenderCount.n = 0;

    const t0 = performance.now();
    const ok = await v.loadTauriDirectory(path, { pullRefresh: true });
    const ms = Math.round(performance.now() - t0);
    for (let i = 0; i < 20; i++) await frame();

    const after = { st: el.scrollTop, visible: visible(), events: v.eventGroups.length, rows: c.listRowNodes().length };
    return JSON.stringify({
        ok, ms, renders: c.__r188RenderCount.n, before, after,
        stats: v.lastScanStats || null,
        skeletonLeft: !!document.querySelector('.scan-skeleton, .scan-progress-bar'),
        toast: document.querySelector('.toast')?.textContent || null,
    });
})()
