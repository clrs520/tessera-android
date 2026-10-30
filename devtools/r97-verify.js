// R97 batch-2 acceptance. Four changes, each judged by what a person would see or hit, and each
// checked against the failure mode this project has already been burned by: state read from JS
// instead of from the rendered box (R42), and a control that is technically present but off-screen
// (R90/R96).
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

    // ---- A: the four new buttons say their name in the current language ----
    const zh = {};
    ['prevEventBtn', 'nextEventBtn', 'prevFrameBtn', 'nextFrameBtn'].forEach(id => {
        zh[id] = document.getElementById(id)?.getAttribute('aria-label');
    });
    ok('A Chinese labels are on the four steppers',
        Object.values(zh).every(x => x && /[一-鿿]/.test(x)), JSON.stringify(zh));
    v.setLanguage('en');
    await sleep(400);
    const en = {};
    ['prevEventBtn', 'nextEventBtn', 'prevFrameBtn', 'nextFrameBtn'].forEach(id => {
        const n = document.getElementById(id);
        en[id] = [n.getAttribute('aria-label'), n.title].join('/');
    });
    ok('A switching to English relabels them, title too',
        Object.values(en).every(x => /^Next |^Previous /.test(x) && x.split('/')[0] === x.split('/')[1]),
        JSON.stringify(en));
    /* The drawer's new page name is stamped by the same call as the labels above, so it is checked
       here rather than by trusting the `data-i18n` attribute — this app has no generic `[data-i18n]`
       pass, only the key list inside `setLanguage`, and a key that is not in it silently stays Chinese. */
    const pageTitle = document.querySelector('.sidebar-header .header-page-name');
    ok('A the drawer page name follows the language too',
        pageTitle && /Clips/i.test(pageTitle.textContent), pageTitle && pageTitle.textContent);
    v.setLanguage('zh');
    await sleep(400);
    ok('A back to Chinese', document.getElementById('prevFrameBtn').getAttribute('aria-label') === '上一帧',
        document.getElementById('prevFrameBtn').getAttribute('aria-label'));

    // ---- B: the empty list now names its own cause ----
    const list = v.videoListComponent;
    const files = v.allFiles;
    const groups = v.eventGroups;
    v.allFiles = [{ path: '/x/a.mp4' }, { path: '/x/b.mp4' }, { path: '/x/c.mp4' }];
    const emptyText = () => (list.container.querySelector('.empty-state p') || {}).textContent || '';
    const hasClear = () => !!list.container.querySelector('.clear-filters-btn');
    v.starredOnly = false; v.triggerOnly = false;
    v.dom.eventSearch.value = ''; v.dom.dateFilter.value = ''; v.dom.eventFilter.value = '';
    list.render([]);
    ok('B no filter + files on disk says the files are unreadable, not "no matches"',
        /3 个文件/.test(emptyText()) && !/没有找到匹配/.test(emptyText()) && !hasClear(), emptyText());
    v.dom.eventSearch.value = 'zzz-no-such-thing';
    list.render([]);
    ok('B with a filter it still says 没有匹配 and offers the way out',
        /没有找到匹配/.test(emptyText()) && hasClear(), `${emptyText()} clear=${hasClear()}`);
    v.dom.eventSearch.value = '';
    v.allFiles = [];
    list.render([]);
    ok('B with nothing scanned at all it falls back to the first-run help',
        !!list.container.querySelector('.empty-state.help-text'),
        list.container.querySelector('.empty-state')?.className);
    v.allFiles = files; v.eventGroups = groups;
    v.filterAndRender();
    await sleep(300);
    ok('B the real list comes back', list.container.querySelectorAll('.video-card').length > 0,
        `${list.container.querySelectorAll('.video-card').length} cards`);

    // ---- C: the controls that were under 40 are now tappable, and nothing moved out ----
    /* Orientation matters and it cost a whole false-failure round: the funnel is *landscape-only*
       (`.filter-toggle-btn { display:none }` at the base, revealed inside the landscape query), so
       measuring it upright reads 0×0 no matter what the CSS says. Portrait asserts the design; the
       landscape numbers come from `r97-verify-landscape.js` after a real rotation. */
    const drawerOpen = () => !document.querySelector('.sidebar').classList.contains('collapsed');
    if (!drawerOpen()) { document.getElementById('tabListBtn').click(); await sleep(700); }
    ok('C the drawer is up for these checks', drawerOpen(), `collapsed=${!drawerOpen()}`);
    ok('C portrait hides the funnel on purpose and shows the filter row instead',
        getComputedStyle(document.querySelector('.filter-toggle-btn')).display === 'none'
        && getComputedStyle(document.querySelector('.event-search')).display !== 'none',
        `funnel=${getComputedStyle(document.querySelector('.filter-toggle-btn')).display}`);
    const title = document.querySelector('.sidebar-header .header-title');
    const shown = [...title.querySelectorAll('span')].filter(s => getComputedStyle(s).display !== 'none');
    ok('C the drawer header names the page instead of the app',
        shown.length === 1 && /片段/.test(shown[0].textContent),
        shown.map(s => s.textContent).join(','));
    const search = box('.event-search');
    ok('C the nav row is still the 44px field it was', search && Math.abs(search.h - 44) < 1.5,
        JSON.stringify(search));
    document.getElementById('drawerDoneBtn').click();
    await sleep(600);
    if (drawerOpen()) { document.getElementById('tabListBtn').click(); await sleep(600); }
    /* Same trap as the drawer, one tier down: the ⋮ panel is `scale(0.98)` while closed, so measuring
       it after a click that *closed* it yields 39.2 for a 40px control and reads like the CSS lost.
       Open it only if it is down, and assert it is visible before trusting a single number. */
    const panel = document.querySelector('.header-actions-group');
    const open = () => getComputedStyle(panel).visibility === 'visible'
        && getComputedStyle(panel).opacity === '1';
    // `.header-right.active` is not a reliable witness — measured here it was set while the panel was
    // still at opacity 0, and the rows then read 39.2 (40 × the 0.98 closed scale). Poll the rendered
    // box itself and nudge once a second until it is genuinely drawn.
    // A previous suite can leave the panel *open*, and then the first nudge click closes it and every
    // row below reads opacity 0. Close first, so a click always means open.
    if (document.querySelector('.header-right')?.classList.contains('active')) {
        document.getElementById('tabMoreBtn').click();
        await sleep(500);
    }
    // 补点只能在「面板根本没露出来」的时候补：这个按钮是开关，按次数补点会把已经开着的面板关掉
    // （i%10 那一版就是这么把自己关掉的，于是下面每一行都读到 opacity 0）。
    for (let i = 0; i < 40 && !open(); i++) {
        if (getComputedStyle(panel).visibility !== 'visible') document.getElementById('tabMoreBtn').click();
        await sleep(100);
    }
    await sleep(400);
    ok('C the ⋮ panel is actually open for these measurements',
        getComputedStyle(panel).visibility === 'visible' && getComputedStyle(panel).opacity === '1',
        `vis=${getComputedStyle(panel).visibility} op=${getComputedStyle(panel).opacity}`);
    const seg = box('.choice-segment');
    ok('C a choice segment is a 40px target', seg && seg.h >= 40, JSON.stringify(seg));
    ok('C the ⋮ panel still fits without scrolling',
        panel.scrollHeight <= panel.clientHeight + 1, `${panel.scrollHeight}/${panel.clientHeight}`);
    const last = [...panel.querySelectorAll('button')].filter(b => getComputedStyle(b).display !== 'none')
        .map(b => b.getBoundingClientRect().bottom);
    ok('C its last row is inside the viewport',
        Math.max(...last) <= innerHeight + 1, `${Math.max(...last).toFixed(0)} of ${innerHeight}`);
    document.getElementById('tabMoreBtn').click();
    await sleep(500);

    // ---- D: desktop keeps the wordmark ----
    /* The first version of this section walked `sheet.cssRules`, which throws for this app's own
       stylesheet under the `tauri.localhost` scheme, and then a hand-rolled brace parser that
       mis-attributed nested rules and reported both edits as ABSENT while §C measured them working.
       Which tier a rule sits in is already proven by the rendered result, so only the desktop half —
       the thing no phone probe can observe — is checked here. */
    const txt = await (await fetch('styles.css')).text();
    ok('D the base state keeps the wordmark for a desktop',
        /\.header-page-name\s*\{\s*display: none;/.test(txt), 'base rule present');
    ok('D nothing outside the phone tiers hides the wordmark',
        (txt.match(/\.header-app-name\s*\{\s*display: none;/g) || []).length === 1,
        `${(txt.match(/\.header-app-name\s*\{\s*display: none;/g) || []).length} rule(s)`);

    ok('D no new uncaught errors', (window.__r93err || []).length === 0, JSON.stringify((window.__r93err || []).slice(0, 2)));
    ok('D the app recorded no errors this session', (v.recentErrors || []).length === 0, JSON.stringify(v.recentErrors));
    return JSON.stringify(out, null, 1);
})();
