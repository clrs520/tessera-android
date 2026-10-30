// R93 real-tap harness, part 1: write one clip for real (a row that came from a made-up path could
// only ever prove the "missing" branch), then put the export page on 范围 and hand back the
// device-pixel centre of every 分享 button plus what elementFromPoint finds there — a `.click()`
// answers even from under an invisible layer, which is the R89 lesson.
// Reads no URL, prints no token; the only path it names is the app's own file name.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'))
        || (v.eventGroups || [])[0];
    if (!ev) return JSON.stringify({ fatal: 'no event on disk' });

    await v.playEvent(ev.eventId);
    for (let i = 0; i < 30 && !v.videoControls.totalDuration; i += 1) await sleep(500);
    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = Math.min(5, v.videoControls.totalDuration || 5);
    v.peSelection.size = '480';
    v.peSelection.cameras = ['front'];
    v.peCaptionKey = null;
    v.peTelemetryKey = null;

    const before = (v.peExports || []).length;
    await v.startPhoneExport();
    const written = v.peJob ? v.peJob.outPath : null;      // `peJob` is cleared the moment it lands
    for (let i = 0; i < 240 && v.peJob; i += 1) await sleep(1000);
    await sleep(1500);

    const dom = v.peDom;
    v.hidePhoneExportModal();
    await sleep(300);
    await v.showPhoneExportModal();
    await sleep(700);
    v.setPhoneExportPane('range');
    await sleep(700);

    const dpr = window.devicePixelRatio;
    // Landscape puts this row below the fold — the sheet's own scroll area is ~411 CSS px tall and
    // the group is the last thing in 范围. Scroll it in before measuring, or the tap lands in the
    // void below the viewport and reads as a dead button (the R89/R90 class of false failure).
    const first = dom.exports.querySelector('.pe-last-row');
    if (first) first.scrollIntoView({ block: 'center', behavior: 'instant' });
    await sleep(400);
    const rows = [...dom.exports.querySelectorAll('.pe-last-row')];
    const points = rows.map((row, i) => {
        const btn = row.querySelector('[data-export-share]');
        const r = btn.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return {
            i, name: row.querySelector('.pe-last-name').textContent,
            x: Math.round((r.left + r.width / 2) * dpr), y: Math.round((r.top + r.height / 2) * dpr),
            w: Math.round(r.width * dpr), h: Math.round(r.height * dpr),
            cssTop: Math.round(r.top), viewportH: window.innerHeight,
            disabled: btn.disabled,
            hit: hit === btn || btn.contains(hit) ? 'self' : (hit ? (hit.id || hit.className || hit.tagName) : 'nothing'),
        };
    });
    return JSON.stringify({
        exported: written ? written.split('/').pop() : null,
        rowsBefore: before, rowsAfter: (v.peExports || []).length,
        rowCount: rows.length, points,
        groupShown: dom.lastGroup.style.display !== 'none',
        stillPainting: v.peJob ? 'job alive' : 'job done',
        dpr, shareBridge: !!(window.TDashcamNative && window.TDashcamNative.shareFile),
        errors: (v.recentErrors || []).length,
    });
})();
