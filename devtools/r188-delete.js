// R188 #2 — what the list does in the two seconds after a delete from deep in a 900-event list.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    if (!c.listWindowed()) return JSON.stringify({ err: 'not windowed' });
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const drain = async (n) => { for (let i = 0; i < n; i++) await frame(); };

    if (!c.__r188Place) {
        const orig = c.placeWindow.bind(c);
        c.__r188Place = { n: 0 };
        c.placeWindow = (start) => { c.__r188Place.n += 1; return orig(start); };
    }

    // Settle at event ~500.
    el.scrollTop = Math.round(500 * (c.windowPitch || 74));
    await drain(40);

    const pitch = c.windowPitch || 74;
    const viewTopAt = () => Math.round(el.scrollTop / pitch);
    const boxes = () => {
        const b = el.getBoundingClientRect();
        const ids = [];
        for (const row of el.querySelectorAll('.video-card')) {
            const r = row.getBoundingClientRect();
            if (r.bottom > b.top + 1 && r.top < b.bottom - 1) ids.push(row.dataset.eventId);
        }
        return ids;
    };

    const targetIndex = viewTopAt() + 2;
    const target = c.listEvents[targetIndex];
    const before = {
        scrollTop: el.scrollTop, viewTop: viewTopAt(), top: c.listTop, end: c.listEnd,
        rows: c.listRowNodes().length, visible: boxes(),
    };
    c.__r188Place.n = 0;

    const samples = [];
    let last = performance.now();
    const sampler = [];
    const sample = (tag) => {
        const now = performance.now();
        samples.push({
            tag,
            dt: Math.round(now - last),
            st: Math.round(el.scrollTop),
            vt: viewTopAt(),
            top: c.listTop,
            end: c.listEnd,
            rows: c.listRowNodes().length,
            vis: boxes().length,
        });
        last = now;
    };
    let stop = false;
    (function loop() {
        if (stop) return;
        sample('t');
        requestAnimationFrame(loop);
    })();

    // The product path: open the confirm sheet, then confirm. (confirmDeleteEvent is async.)
    v.openDeleteConfirm(target);
    const modalShown = document.getElementById('deleteConfirmModal')?.classList.contains('show');
    const t0 = performance.now();
    const done = v.confirmDeleteEvent();
    await done;
    const confirmMs = Math.round(performance.now() - t0);
    await drain(90);
    stop = true;
    await frame();

    const after = {
        scrollTop: el.scrollTop, viewTop: viewTopAt(), top: c.listTop, end: c.listEnd,
        rows: c.listRowNodes().length, visible: boxes(),
        events: v.eventGroups.length,
        anchorHit: null,
    };
    const blanks = samples.filter((s) => s.vis === 0);
    const longestGap = samples.reduce((a, s) => (s.dt > a.dt ? s : a), samples[0]);
    return JSON.stringify({
        pitch, targetIndex, targetId: target?.eventId, modalShown,
        before, after, confirmMs,
        placeWindows: c.__r188Place.n,
        frames: samples.length,
        blankFrames: blanks.length,
        blanks: blanks.slice(0, 8),
        maxGap: longestGap,
        timeline: samples.slice(0, 40),
    });
})()
