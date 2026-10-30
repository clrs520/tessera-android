(() => {
    try {
        const s = document.querySelector('.sidebar');
        window.__dbg = { ev: [] };
        const note = (e) => window.__dbg.ev.push(e.type + '@' + Math.round(e.clientX) + ',' + Math.round(e.clientY) + ' pt=' + JSON.stringify(e.pointerType) + ' id=' + e.pointerId);
        for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) {
            s.addEventListener(t, note, true);
        }
        const orig = viewer.toggleSidebar.bind(viewer);
        window.__dbg.toggles = [];
        viewer.toggleSidebar = (v) => { window.__dbg.toggles.push(String(v) + '@' + new Date().toISOString().slice(11, 19)); return orig(v); };
        window.__dbg.phone = isPhoneLayout();
        window.__dbg.rowClaim = viewer.rowSwipeClaimedAt || 0;
        return JSON.stringify(window.__dbg);
    } catch (e) { return 'THREW ' + e.message; }
})()
