// R99 regression triage: r88-ui reported eight zero-size measurements. Every one of them is *inside*
// the export page, and the suite's own precondition line says the overlay never got `.show` — which the
// app adds from a requestAnimationFrame, and a starved emulator produces no frames (the R90 false
// signal). Re-measure the same surfaces, but wait for the class to land and for a real frame, so the
// answer is about the layout rather than about the scheduler.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const dom = id => document.getElementById(id);
    const modal = dom('phoneExportModal');
    const panel = modal.querySelector('.phone-export-panel');
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const box = n => { const b = n && n.getBoundingClientRect ? n.getBoundingClientRect() : { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
        return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height) }; };
    const shown = n => getComputedStyle(n).display !== 'none' && getComputedStyle(n).visibility !== 'hidden';

    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
    await v.showPhoneExportModal();
    for (let i = 0; i < 80 && !modal.classList.contains('show'); i++) await sleep(100);
    ok('precondition: the page is shown', modal.classList.contains('show'), `cls="${modal.className}"`);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(500);

    const nav = box(modal.querySelector('.pe-nav'));
    const back = box(dom('peCloseBtn'));
    const go = box(dom('peStartBtn'));
    ok('the nav bar is a bar', nav.h >= 40, JSON.stringify(nav));
    ok('返回 and 开始导出 are 40px thumb targets in it',
        back.h >= 40 && go.h >= 40 && back.top >= nav.top - 1 && go.bottom <= nav.bottom + 1,
        JSON.stringify({ back, go, nav }));
    const dock = box(dom('pePreviewDock'));
    const panelBox = box(panel);
    const body = box(modal.querySelector('.pe-body'));
    ok('the pinned preview band has width and touches the panel bottom',
        shown(dom('pePreviewDock')) && dock.w > 40 && Math.abs(dock.bottom - panelBox.bottom) <= 2
        && Math.abs(dock.top - body.bottom) <= 2,
        JSON.stringify({ dock, panelBottom: panelBox.bottom, bodyBottom: body.bottom }));
    const range = modal.querySelector('#pePaneRange') || [...modal.querySelectorAll('.pe-pane')][2];
    const sides = [...(range ? range.querySelectorAll('.pe-side') : [])].map(box);
    ok('起始 ± 与 结束 ± share a row and a height',
        sides.length === 2 && Math.abs(sides[0].top - sides[1].top) < 2
        && sides.every(s => s.h >= 32 && s.h <= 64), JSON.stringify(sides));
    const tiles = modal.querySelectorAll('.pe-tile, .pe-cell');
    ok('the layout editor has its tiles laid out', tiles.length === 0 || [...tiles].every(t => t.getBoundingClientRect().height > 20),
        `${tiles.length} tiles`);
    return out;
})()
