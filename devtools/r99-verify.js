// R99 acceptance, portrait. Three things the user reported from a Xiaomi 14, each judged by what a
// finger would meet rather than by whether a rule exists in the sheet: the gap between the ⋮ panel and
// the bottom bar, and the view switcher that had been squeezed into a 41 px strip.
//
// Traps already paid for (see the acceptance-false-signals note): `--safe-bottom` is not a constant,
// so nothing here asserts an absolute y; `element.click()` does not hit-test, so the chips are checked
// with `elementFromPoint`; the ⋮ panel is `scale(0.98)` while closed, so it is opened and confirmed
// visible before a single number is trusted.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (name, cond, detail) => (cond ? out.pass : out.fail).push(name + (detail === undefined ? '' : ' = ' + detail));
    const cs = (n, p) => (p.startsWith('--')
        ? getComputedStyle(n).getPropertyValue(p)
        : getComputedStyle(n)[p]);
    const root = getComputedStyle(document.documentElement);
    const panel = document.getElementById('headerActionsGroup');
    const bar = document.querySelector('.phone-action-bar');
    const sw = document.getElementById('viewSwitcher');
    const section = document.querySelector('.controls-section');
    const lane = () => section.getBoundingClientRect();

    // The transport row and the view switcher only exist once an event is open — measuring the landing
    // page yields nine 0×0 chips and reads as nineteen failures. R88 fell into exactly this.
    if (document.querySelector('.player-area.empty') || !(sw && sw.getBoundingClientRect().width > 0)) {
        const ev = (v.eventGroups || [])[0];
        await v.playEvent(ev.eventId);
    }
    for (let i = 0; i < 40 && !(sw.getBoundingClientRect().width > 0 && section.getBoundingClientRect().width > 0); i++) {
        await sleep(300);
    }
    ok('surface is open before anything is measured', sw.getBoundingClientRect().width > 0,
        `switcher=${sw.getBoundingClientRect().width.toFixed(0)}`);

    const openPanel = async () => {
        for (let i = 0; i < 25 && +cs(panel, 'opacity') !== 1; i++) {
            if (i % 8 === 0) document.getElementById('tabMoreBtn').click();
            await sleep(250);
        }
        return +cs(panel, 'opacity') === 1 && cs(panel, 'visibility') === 'visible';
    };

    // A 12 px gap is the design; the *inset* is what used to be added on top of `--action-h`, so the
    // assertion is on the gap between the two boxes, not on either box's absolute position.
    const gapNow = () => bar.getBoundingClientRect().top - panel.getBoundingClientRect().bottom;

    ok('panel opens in portrait', await openPanel(), cs(panel, 'opacity'));
    const safeTopPx = parseFloat(cs(document.documentElement, '--safe-top')) || 0;
    const g1 = gapNow();
    ok('A the ⋮ panel sits one intended gap above the bar', Math.abs(g1 - 12) <= 1.5, `${g1.toFixed(1)} px`);
    ok('A the gap is the CSS intent, not a leftover inset',
        Math.abs((parseFloat(cs(panel, 'bottom')) - parseFloat(root.getPropertyValue('--action-h'))) - 12) <= 1,
        `bottom=${cs(panel, 'bottom')}`);
    ok('A it does not overlap the bar', panel.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 0.5);
    ok('A it clears the status bar', panel.getBoundingClientRect().top >= safeTopPx - 0.5,
        `top=${panel.getBoundingClientRect().top.toFixed(1)} safeTop=${safeTopPx}`);

    // The gap used to change when a clip started playing (the bar's footprint moves, and the old
    // formula added a second copy of the inset). Same 12 px must survive the state change.
    if (!v.videoControls.isPlaying) { v.videoControls.togglePlayPause(); await sleep(1200); }
    const gPlay = gapNow();
    ok('A playing does not change the gap', Math.abs(gPlay - 12) <= 1.5, `${gPlay.toFixed(1)} px`);
    if (v.videoControls.isPlaying) { v.videoControls.togglePlayPause(); await sleep(600); }

    // B: portrait keeps its group headings, and they head a full row.
    const divs = [...panel.querySelectorAll('.menu-divider')];
    const shownDivs = divs.filter(d => cs(d, 'display') !== 'none');
    ok('B the group headings show in portrait', shownDivs.length === divs.length && divs.length >= 3,
        `${shownDivs.length}/${divs.length}`);
    const pw = panel.clientWidth;
    ok('B each heading owns a whole row',
        shownDivs.every(d => d.getBoundingClientRect().width > pw * 0.8),
        shownDivs.map(d => Math.round(d.getBoundingClientRect().width)).join(','));
    ok('B no portrait row is cut by the plate', panel.scrollHeight <= panel.clientHeight + 1,
        `content=${panel.scrollHeight} client=${panel.clientHeight}`);
    // Same measurement the landscape tier needs: a sub-pixel deficit still costs a whole glyph.
    const cut = [...panel.querySelectorAll('.btn-text')].filter(n => n.textContent.trim())
        .map(n => { const rg = document.createRange(); rg.selectNodeContents(n);
            return { txt: (n.textContent || '').trim().slice(0, 10), need: rg.getBoundingClientRect().width, got: n.getBoundingClientRect().width }; })
        .filter(r => r.need > r.got + 0.3);
    ok('B no portrait label is ellipsised', cut.length === 0,
        cut.map(r => `${r.txt} ${r.need.toFixed(1)}>${r.got.toFixed(1)}`).join(' | '));

    document.getElementById('tabMoreBtn').click();
    await sleep(500);

    // C: the view switcher. Nine chips at 40 px plus the separator is 380 px, which the transport row
    // could not give it — so it takes its own line, and every chip has to be *reachable*, not merely
    // laid out (a scroll strip hides chips behind a scrollbar that reads as fine in computed style).
    //
    // State first: the transport row steps out while the ⋮ sheet is up (by design) and auto-hides a few
    // seconds into playback, and a hidden row is `pointer-events: none`, so `elementFromPoint` falls
    // straight through to `.player-area` and all nine chips look dead. Pause, reveal, then hit-test.
    const ovl = document.querySelector('.video-controls-overlay');
    // `.show` fades in over 300 ms and rotating re-hides the row, so calling showControls() once and
    // sleeping is not the same as the row being up: a fade caught mid-flight reads `opacity: 0` and
    // every hit-test below it falls through to `.player-area`. Poll until it has landed.
    if (v.videoControls.isPlaying) { v.videoControls.togglePlayPause(); await sleep(600); }
    for (let i = 0; i < 16 && +cs(ovl, 'opacity') !== 1; i++) { v.videoControls.showControls(); await sleep(250); }
    ok('C the transport row is really showing before anything is tapped',
        +cs(ovl, 'opacity') === 1 && cs(ovl, 'pointerEvents') !== 'none' && !document.body.classList.contains('more-panel-open'),
        `op=${cs(ovl, 'opacity')} pe=${cs(ovl, 'pointerEvents')} body=${[...document.body.classList].join(',')}`);
    const sr = sw.getBoundingClientRect();
    ok('C the switcher is on its own line in portrait',
        sr.width > lane().width * 0.9 && sr.top < document.querySelector('.controls-left').getBoundingClientRect().top,
        `sw=${sr.width.toFixed(0)} lane=${lane().width.toFixed(0)}`);
    ok('C the strip has nothing left to scroll', sw.scrollWidth <= sw.clientWidth + 1,
        `scroll=${sw.scrollWidth} client=${sw.clientWidth}`);
    const chips = [...sw.querySelectorAll('.view-btn')];
    ok('C nine view chips exist', chips.length === 9, chips.length);
    for (const c of chips) {
        const r = c.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        ok(`C chip ${c.dataset.view} is tappable at its centre`,
            hit === c || c.contains(hit), `${Math.round(r.width)}x${Math.round(r.height)} hit=${hit && (hit.id || hit.className)}`);
    }
    ok('C every chip is a real touch target',
        chips.every(c => { const r = c.getBoundingClientRect(); return r.width >= 39.5 && r.height >= 39.5; }),
        chips.map(c => Math.round(c.getBoundingClientRect().width)).join(','));
    ok('C the transport row does not overflow its lane', section.scrollWidth <= section.clientWidth + 1,
        `scroll=${section.scrollWidth} client=${section.clientWidth}`);
    for (const id of ['fullscreenBtn', 'clipBtn', 'speedBtn']) {
        const r = document.getElementById(id).getBoundingClientRect();
        ok(`C ${id} is on screen`, r.left >= 0 && r.right <= innerWidth + 0.5 && r.width > 0,
            `${r.left.toFixed(0)}..${r.right.toFixed(0)}`);
    }
    // The row grew a line, and every surface that reserves space reads it from this measurement.
    const ov = document.querySelector('.video-controls-overlay');
    ok('C the reserve tracks the taller control row',
        Math.abs(parseFloat(root.getPropertyValue('--controls-h')) - ov.getBoundingClientRect().height) <= 2,
        `--controls-h=${root.getPropertyValue('--controls-h').trim()} overlay=${ov.getBoundingClientRect().height.toFixed(1)}`);
    const pl = document.querySelector('.player-area');
    ok('C the picture did not lose its height to the second line',
        pl.getBoundingClientRect().height > 100, `${pl.getBoundingClientRect().height.toFixed(0)} px`);

    return { orient: `${innerWidth}x${innerHeight}`, pass: out.pass.length, fail: out.fail, passes: out.pass };
})()
