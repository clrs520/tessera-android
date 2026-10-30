// The funnel and the landscape chip sizes can only be measured sideways — the funnel is revealed by
// the landscape query alone. Driven by `r97-landscape.sh`, which rotates, runs this, rotates back.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (name, cond, detail) => (cond ? out.pass : out.fail)
        .push(name + (detail === undefined ? '' : ' = ' + detail));
    const box = (sel) => {
        const n = document.querySelector(sel);
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { h: +r.height.toFixed(1), w: +r.width.toFixed(1), right: +r.right.toFixed(0) };
    };
    ok('the device really is sideways', innerWidth > innerHeight, `${innerWidth}x${innerHeight}`);
    const drawerOpen = () => !document.querySelector('.sidebar').classList.contains('collapsed');
    if (!drawerOpen()) { document.getElementById('tabListBtn').click(); await sleep(800); }
    const funnel = box('.sidebar-header .filter-toggle-btn');
    ok('the landscape funnel is a 40px target', funnel && funnel.h >= 40 && funnel.w >= 40, JSON.stringify(funnel));
    ok('the funnel is inside the viewport', funnel && funnel.right <= innerWidth + 1, JSON.stringify(funnel));
    const shown = [...document.querySelectorAll('.sidebar-header .header-title span')]
        .filter(s => getComputedStyle(s).display !== 'none').map(s => s.textContent);
    ok('the drawer header names the page sideways too', shown.length === 1 && /片段/.test(shown[0]), shown.join(','));
    const list = box('#fileList .video-card') || box('.video-card');
    ok('the list still has usable height under the taller header controls', list && list.h >= 40,
        JSON.stringify(list));
    const rows = document.querySelectorAll('.video-card').length;
    ok('and it shows more than one row of clips', rows > 1, `${rows} cards`);
    document.getElementById('drawerDoneBtn').click();
    await sleep(700);
    if (!document.querySelector('.header-right').classList.contains('active')) {
        document.getElementById('tabMoreBtn').click();
        await sleep(700);
    }
    const pstyle = getComputedStyle(document.querySelector('.header-actions-group'));
    ok('the ⋮ panel is open before it is measured',
        pstyle.visibility === 'visible' && pstyle.opacity === '1',
        `vis=${pstyle.visibility} op=${pstyle.opacity}`);
    const seg = box('.choice-segment');
    ok('a landscape choice segment is a 40px target', seg && seg.h >= 40, JSON.stringify(seg));
    const panel = document.querySelector('.header-actions-group');
    const bottoms = [...panel.querySelectorAll('button')].filter(b => getComputedStyle(b).display !== 'none')
        .map(b => b.getBoundingClientRect().bottom);
    ok('the landscape ⋮ panel keeps every row on screen',
        Math.max(...bottoms) <= innerHeight + 1, `${Math.max(...bottoms).toFixed(0)} of ${innerHeight}`);
    return JSON.stringify(out, null, 1);
})();
