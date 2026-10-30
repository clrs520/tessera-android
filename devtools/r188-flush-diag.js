// R188 #4 diag — is the undo fuse firing, and does the native answer come back?
(async () => {
    const v = window.viewer;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const log = [];
    const t0 = performance.now();
    const at = () => Math.round(performance.now() - t0);

    if (!window.__r188WrapDelete) {
        window.__r188WrapDelete = { orig: window.__tdashcamDeleteResult, last: null };
        window.__tdashcamDeleteResult = (r) => {
            window.__r188WrapDelete.last = r;
            log.push([at(), 'bridge', JSON.stringify(r).slice(0, 120)]);
            try { return window.__r188WrapDelete.orig(r); } catch (e) { return undefined; }
        };
    }
    window.__r188WrapDelete.last = null;

    const ev = v.eventGroups.find((e) => v.eventDeleteTargets(e));
    v.openDeleteConfirm(ev);
    await v.confirmDeleteEvent();
    log.push([at(), 'confirmed', ev.eventId]);

    const t1 = performance.now();
    while (performance.now() - t1 < 25000) {
        await frame();
        await new Promise((r) => setTimeout(r, 250));
        log.push([at(), 'tick', !!v.pendingDeleteUndo, window.__r188WrapDelete.last ? 'got' : '-', document.visibilityState]);
        if (window.__r188WrapDelete.last) break;
    }
    return JSON.stringify({
        eventId: ev.eventId,
        visibility: document.visibilityState,
        last: window.__r188WrapDelete.last,
        toasts: Array.from(document.querySelectorAll('.toast')).map((n) => n.textContent),
        log: log.slice(0, 40),
    });
})()
