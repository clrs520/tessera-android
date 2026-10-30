// Arm a real delete from the player tab (drawer closed, so the bottom bar is on screen) and read
// both boxes at three settle times, then cancel it. The bar is the thing the pill must not cover.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const target = v.eventGroups[v.eventGroups.length - 1];
    const targets = v.eventDeleteTargets(target);
    const groups = v.eventGroups.length;
    v.pendingDelete = { event: target, targets };
    await v.confirmDeleteEvent();
    const read = () => {
        const p = document.querySelector('body > .toast.has-action');
        if (!p) return null;
        const r = p.getBoundingClientRect();
        const bar = document.querySelector('.phone-action-bar');
        const br = bar.getBoundingClientRect();
        const bs = getComputedStyle(bar);
        return { at: p.className, tf: getComputedStyle(p).transform, cb: getComputedStyle(p).bottom,
            pill: [+r.top.toFixed(1), +r.bottom.toFixed(1)],
            bar: [+br.top.toFixed(1), +br.bottom.toFixed(1), bs.visibility, bs.opacity, bs.transform],
            clearance: +(br.top - r.bottom).toFixed(1) };
    };
    const out = {};
    await sleep(150); out.t150 = read();
    await sleep(850); out.t1000 = read();
    await sleep(1000); out.t2000 = read();
    out.drawerCollapsed = document.body.classList.contains('sidebar-collapsed');
    out.safeBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom');
    out.inner = innerHeight;
    if (v.pendingDeleteUndo) v.undoDelete(v.pendingDeleteUndo);
    out.restored = v.eventGroups.length === groups;
    return out;
})()
