// R188 #2 — instrument the exact sequence inside confirmDeleteEvent.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const drain = async (n) => { for (let i = 0; i < n; i++) await frame(); };

    el.scrollTop = Math.round(500 * (c.windowPitch || 74));
    await drain(40);

    const log = [];
    const t0 = performance.now();
    const mark = (what, extra) => log.push([Math.round(performance.now() - t0), what, Math.round(el.scrollTop), c.listTop, c.listEnd, extra ?? '']);

    if (!c.__r188Wrapped) {
        c.__r188Wrapped = true;
        const place = c.placeWindow.bind(c);
        c.placeWindow = (start) => {
            c.__r188Log?.push(['place', Math.round(performance.now() - (c.__r188T0 || 0)), start, el.scrollTop, c.listTop, c.listEnd]);
            return place(start);
        };
    }
    c.__r188Log = [];
    c.__r188T0 = performance.now();
    el.addEventListener('scroll', () => c.__r188Log.push(['scroll', Math.round(performance.now() - c.__r188T0), el.scrollTop]), { passive: true });

    const origRestore = v.restoreListAnchor.bind(v);
    v.restoreListAnchor = (anchor) => {
        c.__r188Log.push(['restore-before', Math.round(performance.now() - c.__r188T0), el.scrollTop, anchor?.id, anchor?.scrollTop]);
        const r = origRestore(anchor);
        c.__r188Log.push(['restore-after', Math.round(performance.now() - c.__r188T0), el.scrollTop, c.listTop, c.listEnd]);
        return r;
    };

    const idx = Math.round(el.scrollTop / (c.windowPitch || 74)) + 2;
    const target = c.listEvents[idx];
    mark('picked', target?.eventId);
    v.openDeleteConfirm(target);
    mark('modal-open');
    await v.confirmDeleteEvent();
    mark('confirmed');
    await drain(10);
    mark('after-10f');
    await drain(40);
    mark('after-50f');
    return JSON.stringify({
        target: target?.eventId,
        log,
        now: { st: el.scrollTop, top: c.listTop, end: c.listEnd, rows: c.listRowNodes().length, events: v.eventGroups.length },
    });
})()
