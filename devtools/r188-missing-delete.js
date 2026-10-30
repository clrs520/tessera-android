// R188 #4 — a batch where one file is already gone must still delete the rest (and say so).
// The page's own `window.__tdashcamDeleteResult` is the native bridge callback: wrap it, never
// replace it — nulling it out makes the native answer unreachable and fakes a failure.
(async () => {
    const v = window.viewer;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const drain = async (n) => { for (let i = 0; i < n; i++) await frame(); };

    let captured = null;
    if (!window.__r188WrapDelete) {
        window.__r188WrapDelete = { orig: window.__tdashcamDeleteResult, last: null };
        window.__tdashcamDeleteResult = (r) => {
            window.__r188WrapDelete.last = r;
            try { return window.__r188WrapDelete.orig(r); } catch (e) { return undefined; }
        };
    }
    window.__r188WrapDelete.last = null;

    const wantedId = window.__r188TargetId;
    const off = wantedId
        ? v.eventGroups.find((ev) => ev && ev.eventId === wantedId)
        : v.eventGroups.find((ev) => v.eventDeleteTargets(ev));
    if (!off) return JSON.stringify({ err: 'no target', wantedId });
    const targets = v.eventDeleteTargets(off);
    v.openDeleteConfirm(off);
    const t0 = performance.now();
    await v.confirmDeleteEvent();
    const confirmMs = Math.round(performance.now() - t0);

    let result = null;
    while (performance.now() - t0 < 40000) {
        await drain(2);
        if (window.__r188WrapDelete.last) { result = window.__r188WrapDelete.last; break; }
        await new Promise((r) => setTimeout(r, 120));
    }
    const toasts = Array.from(document.querySelectorAll('.toast')).map((n) => n.textContent);
    return JSON.stringify({
        eventId: off.eventId,
        targets: targets.length,
        confirmMs,
        result,
        stillInList: !!v.eventGroups.find((ev) => ev && ev.eventId === off.eventId),
        toasts,
    });
})()
