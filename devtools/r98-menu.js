// R98: the ⋮ panel gained a row. Check it still fits, both tiers, and that the new row is a real
// 40px target — the R97 lesson is that a control can be present, correct in JS, and unreachable.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (name, cond, detail) => (cond ? out.pass : out.fail)
        .push(name + (detail === undefined ? '' : ' = ' + detail));

    const panel = document.getElementById('headerActionsGroup');
    const btn = document.getElementById('loopABBtn');
    const menuBtn = document.getElementById('headerMenuBtn');
    const isOpen = () => getComputedStyle(panel).opacity === '1'
        && getComputedStyle(panel).visibility === 'visible';
    // Clicking the funnel while the panel is open closes it, and a closed panel still reports
    // visibility:visible — only the opacity and the 0.98 scale say which state it is in (R97). So
    // nudge it once a second until it is verifiably open; a wrong first click self-corrects.
    for (let i = 0; i < 30 && !isOpen(); i++) {
        if (i % 10 === 0) menuBtn.click();
        await sleep(100);
    }
    await sleep(400);

    const ps = getComputedStyle(panel);
    ok('M the panel is open and measured while it is actually drawn',
        ps.visibility === 'visible' && ps.opacity !== '0', `${ps.visibility}/${ps.opacity}`);
    const pr = panel.getBoundingClientRect();
    ok('M the panel itself is inside the viewport',
        pr.top >= -1 && pr.bottom <= innerHeight + 1, `${pr.top.toFixed(0)}..${pr.bottom.toFixed(0)} of ${innerHeight}`);

    const bs = getComputedStyle(btn);
    const br = btn.getBoundingClientRect();
    ok('M the A-B row is drawn', bs.display !== 'none' && br.height > 0, `${br.width.toFixed(0)}x${br.height.toFixed(0)}`);
    ok('M it is a 40px-or-better target', br.height >= 40, br.height.toFixed(1));
    ok('M it is inside the panel box, not hung over its edge',
        br.bottom <= pr.bottom + 1 && br.left >= pr.left - 1,
        `row ${br.left.toFixed(0)}..${br.bottom.toFixed(0)} panel ${pr.left.toFixed(0)}..${pr.bottom.toFixed(0)}`);
    // The panel scrolls when the rows exceed it (R56). Overflow has to be reachable, not clipped.
    const scrollable = panel.scrollHeight > panel.clientHeight + 1
        || (panel.firstElementChild && panel.firstElementChild.scrollHeight > panel.firstElementChild.clientHeight + 1);
    const inner = [...panel.children].find(el => el.scrollHeight > el.clientHeight + 1);
    ok('M if it overflows, the overflow is scrollable rather than cut off',
        !scrollable || ps.overflowY === 'auto' || ps.overflowY === 'scroll'
        || getComputedStyle(inner || panel).overflowY !== 'visible',
        `panel ${panel.clientHeight}/${panel.scrollHeight}${inner ? ' inner ' + inner.id : ''}`);
    const rectOfRow = `${Math.round(br.left)},${Math.round(br.top)}`;
    out.rows = [...panel.querySelectorAll('button')].map(el => {
        const r = el.getBoundingClientRect();
        return `${el.id || el.className}:${r.height.toFixed(0)}`;
    });
    out.rowTarget = rectOfRow;
    out.summary = `pass=${out.pass.length} fail=${out.fail.length}`;
    return out;
})()
