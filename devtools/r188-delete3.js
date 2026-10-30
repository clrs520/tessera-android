// R188 #2 — delete from deep in a windowed list; the viewport must never lose its rows.
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

    el.scrollTop = Math.round(500 * (c.windowPitch || 74));
    await drain(40);

    const pitch = c.windowPitch || 74;
    const viewTopAt = () => Math.round(el.scrollTop / pitch);
    const visible = () => {
        const b = el.getBoundingClientRect();
        const ids = [];
        for (const row of el.querySelectorAll('.video-card')) {
            const r = row.getBoundingClientRect();
            if (r.bottom > b.top + 1 && r.top < b.bottom - 1) ids.push(row.dataset.eventId);
        }
        return ids;
    };

    const target = c.listEvents[viewTopAt() + 2];
    const before = {
        st: el.scrollTop, vt: viewTopAt(), top: c.listTop, end: c.listEnd,
        rows: c.listRowNodes().length, visible: visible(),
    };
    c.__r188Place.n = 0;

    const samples = [];
    let last = performance.now();
    let stop = false;
    const sample = (tag) => {
        const now = performance.now();
        samples.push({ tag, dt: Math.round(now - last), st: Math.round(el.scrollTop),
            top: c.listTop, end: c.listEnd, rows: c.listRowNodes().length, vis: visible().length });
        last = now;
    };
    (function loop() { if (stop) return; sample('t'); requestAnimationFrame(loop); })();

    v.openDeleteConfirm(target);
    const t0 = performance.now();
    await v.confirmDeleteEvent();
    const confirmMs = Math.round(performance.now() - t0);
    await drain(90);
    stop = true;
    await frame();

    const after = {
        st: el.scrollTop, vt: viewTopAt(), top: c.listTop, end: c.listEnd,
        rows: c.listRowNodes().length, visible: visible(), events: v.eventGroups.length,
    };
    const dead = samples.filter((s) => s.st > 2000 && s.vis === 0);
    return JSON.stringify({
        pitch, targetId: target?.eventId,
        before, after, confirmMs,
        placeWindows: c.__r188Place.n,
        frames: samples.length,
        blankWhileDeep: dead.length,
        blankSamples: dead.slice(0, 6),
        maxGap: samples.reduce((a, s) => (s.dt > a.dt ? s : a), samples[0]),
        firstFrames: samples.slice(0, 12),
    });
})()
