// R189 — a changed pull-refresh must keep the reader's place (the anchor path, not just keepScroll).
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    const path = v.lastScannedPath;
    if (!path) return JSON.stringify({ err: 'no path' });
    const frame = () => new Promise((r) => requestAnimationFrame(r));

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
    const before = { st: Math.round(el.scrollTop), visible: visible(), events: v.eventGroups.length };

    const t0 = performance.now();
    const ok = await v.loadTauriDirectory(path, { pullRefresh: true });
    const ms = Math.round(performance.now() - t0);
    for (let i = 0; i < 20; i++) await frame();
    const after = { st: Math.round(el.scrollTop), visible: visible(), events: v.eventGroups.length };
    return JSON.stringify({
        ok, ms, before, after,
        sameAnchor: before.visible[0] === after.visible[0],
        listIntact: c.listEvents?.length ?? null,
        toast: document.querySelector('.toast')?.textContent || null,
    });
})()
