// R93 real-tap harness, part 3: the 已经不在了 branch. The driver sets `__r93seed` to 1 to reopen
// the sheet, lay one row on a path that is not on disk and hand back its tap point; then to 0 to
// read what the tap did — the row must be gone and the toast must be the page's own words.
(async () => {
    const v = viewer;
    const dom = v.peDom;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (window.__r93seed) {
        // The harness just pressed BACK, which closes the whole sheet, so this arm reopens it and
        // goes back to 范围 instead of assuming the last state survived.
        await v.showPhoneExportModal();
        await sleep(700);
        v.setPhoneExportPane('range');
        await sleep(500);
        v.writeExportHistory([{ path: '/storage/emulated/0/Download/Tessera_deleted_probe.mp4', bytes: 4000000 }]);
        v.renderPhoneExports();
        const btn = dom.exports.querySelector('[data-export-share]');
        if (btn) btn.scrollIntoView({ block: 'center', behavior: 'instant' });
        await sleep(400);
        const r = btn.getBoundingClientRect();
        return JSON.stringify({
            mode: 'armed',
            rows: dom.exports.querySelectorAll('.pe-last-row').length,
            name: (dom.exports.querySelector('.pe-last-name') || {}).textContent,
            x: Math.round((r.left + r.width / 2) * window.devicePixelRatio),
            y: Math.round((r.top + r.height / 2) * window.devicePixelRatio),
            cssTop: Math.round(r.top), viewportH: window.innerHeight,
            hit: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === btn ? 'self' : 'other',
        });
    }
    return JSON.stringify({
        mode: 'read',
        rows: dom.exports.querySelectorAll('.pe-last-row').length,
        stored: (localStorage.getItem('tdashcam.exportHistory') || 'null').slice(0, 90),
        groupShown: dom.lastGroup.style.display !== 'none',
        toasts: [...document.querySelectorAll('.toast')].map((n) => n.textContent),
        roles: [...document.querySelectorAll('.toast')].map((n) => n.getAttribute('role') || '-'),
        errors: (v.recentErrors || []).length,
    });
})();
