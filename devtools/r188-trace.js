// R188 #2 — trace filterAndRender / render / placeWindow / restore with timestamps.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const drain = async (n) => { for (let i = 0; i < n; i++) await frame(); };

    // Put the window back under the thumb first.
    el.scrollTop = Math.round(500 * (c.windowPitch || 74));
    await drain(30);
    c.syncListWindow();
    await drain(10);

    const log = [];
    const t0 = performance.now();
    const push = (...a) => log.push([Math.round(performance.now() - t0), ...a]);

    if (!c.__r188Trace) {
        c.__r188Trace = true;
        const far = v.filterAndRender.bind(v);
        v.filterAndRender = (o) => { push('filterAndRender', o?.anchor ? 'anchor' : 'no-anchor', el.scrollTop, c.listTop, c.listEnd); const r = far(o); push('filterAndRender-done', el.scrollTop, c.listTop, c.listEnd); return r; };
        const rend = c.render.bind(c);
        c.render = (ev) => { push('render', ev?.length, el.scrollTop, c.listTop, c.listEnd); const r = rend(ev); push('render-done', el.scrollTop, c.listTop, c.listEnd, c.listRowNodes().length); return r; };
        const place = c.placeWindow.bind(c);
        c.placeWindow = (s) => { push('place', s, el.scrollTop); const r = place(s); push('place-done', s, el.scrollTop, c.listTop, c.listEnd, c.listRowNodes().length); return r; };
        const restore = v.restoreListAnchor.bind(v);
        v.restoreListAnchor = (a) => { push('restore', a?.id, a?.scrollTop, el.scrollTop); const r = restore(a); push('restore-done', a?.scrollTop, el.scrollTop, c.listTop, c.listEnd); return r; };
        el.addEventListener('scroll', () => push('scroll', el.scrollTop, c.listTop, c.listEnd), { passive: true });
    }

    const idx = Math.round(el.scrollTop / (c.windowPitch || 74)) + 2;
    const target = c.listEvents[idx];
    push('picked', target?.eventId, idx);
    v.openDeleteConfirm(target);
    await v.confirmDeleteEvent();
    push('confirmed');
    await drain(20);
    push('after-20f', el.scrollTop, c.listTop, c.listEnd, c.listRowNodes().length);
    await drain(30);
    push('after-50f', el.scrollTop, c.listTop, c.listEnd, c.listRowNodes().length);
    return JSON.stringify({ target: target?.eventId, log, events: v.eventGroups.length });
})()
