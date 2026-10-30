// R99 acceptance, landscape — the 「排版不美观」 report. This is the second of the two orientations
// and it has to be measured after really rotating: the portrait suite proves nothing about the grid
// tier, and a rule written into the wrong media query reads as success while doing nothing.
//
// What this build promises sideways: the three group headings are back and each owns a row, the grid
// takes as many 112 px columns as the width allows (seven on this AVD), the one row whose label cannot
// fit any cell spans two, and the whole sheet therefore fits without scrolling.
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
    const ovl = document.querySelector('.video-controls-overlay');

    // The transport assertions run before the sheet goes up, on purpose: the row steps out by design
    // while the ⋮ panel is open, so measuring it afterwards reports every control as unreachable.
    const sw = document.getElementById('viewSwitcher');
    const lane = document.querySelector('.controls-section');
    if (v.videoControls.isPlaying) { v.videoControls.togglePlayPause(); await sleep(600); }
    // Poll, do not sleep: `.show` fades over 300 ms, rotation re-hides the row, and a hit-test taken
    // mid-fade falls through to `.player-area` and looks like a dead control (portrait saw all nine
    // chips "unreachable" this way on the first run).
    for (let i = 0; i < 16 && +getComputedStyle(ovl).opacity !== 1; i++) { v.videoControls.showControls(); await sleep(250); }
    ok('C the transport row is showing sideways',
        +getComputedStyle(ovl).opacity === 1 && getComputedStyle(ovl).pointerEvents !== 'none',
        `op=${getComputedStyle(ovl).opacity} pe=${getComputedStyle(ovl).pointerEvents}`);
    ok('C the switcher stays inline sideways',
        sw.getBoundingClientRect().width < lane.getBoundingClientRect().width * 0.6,
        `sw=${sw.getBoundingClientRect().width.toFixed(0)} lane=${lane.getBoundingClientRect().width.toFixed(0)}`);
    ok('C and still shows every chip sideways', sw.scrollWidth <= sw.clientWidth + 1,
        `scroll=${sw.scrollWidth} client=${sw.clientWidth}`);
    const chips = [...sw.querySelectorAll('.view-btn')];
    const badChip = chips.find(c => { const r = c.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(hit === c || c.contains(hit)); });
    ok('C every chip is reachable sideways too', !badChip, badChip && badChip.dataset.view);

    for (let i = 0; i < 25 && +cs(panel, 'opacity') !== 1; i++) {
        if (i % 8 === 0) document.getElementById('tabMoreBtn').click();
        await sleep(250);
    }
    ok('panel is genuinely open sideways', +cs(panel, 'opacity') === 1 && cs(panel, 'visibility') === 'visible',
        `op=${cs(panel, 'opacity')}`);

    const cols = cs(panel, 'gridTemplateColumns').split(' ').filter(Boolean);
    ok('D the grid gives the sheet its width back', cols.length >= 6, `${cols.length} cols × ${Math.round(parseFloat(cols[0]))}px`);

    const divs = [...panel.querySelectorAll('.menu-divider')];
    const shown = divs.filter(d => cs(d, 'display') !== 'none');
    ok('D the group headings show sideways', shown.length === divs.length && divs.length >= 3,
        `${shown.length}/${divs.length}`);
    const plate = panel.getBoundingClientRect();
    ok('D each heading spans the grid, so nothing interleaves',
        shown.every(d => d.getBoundingClientRect().width > panel.clientWidth * 0.8),
        shown.map(d => Math.round(d.getBoundingClientRect().width)).join(','));
    // The bug was an item landing in the *same row* as the heading it does not belong to. A heading is
    // a row boundary only if the row after it starts below it.
    for (const d of shown) {
        const next = d.nextElementSibling;
        if (!next) continue;
        ok(`D 「${(d.textContent || '').trim()}」 starts a row`,
            next.getBoundingClientRect().top >= d.getBoundingClientRect().bottom - 1,
            `next top=${next.getBoundingClientRect().top.toFixed(1)}`);
    }

    ok('D the whole sheet fits: nothing to scroll', panel.scrollHeight <= panel.clientHeight + 1,
        `content=${panel.scrollHeight} client=${panel.clientHeight}`);
    // `scrollWidth > clientWidth` is the wrong question here: `.btn-text` is a nowrap flex item, so it
    // reports no self-overflow at a 0.7 px deficit while the browser still drops a whole glyph and
    // paints 「连续播放：…」. Measure the text's own painted width against the box it was laid out in.
    const ellipsised = scope => [...scope.querySelectorAll('.btn-text, .choice-label')]
        .filter(n => n.textContent.trim())
        .map(n => {
            const rg = document.createRange();
            rg.selectNodeContents(n);
            return { txt: (n.textContent || '').trim().slice(0, 10),
                need: rg.getBoundingClientRect().width, got: n.getBoundingClientRect().width };
        })
        .filter(r => r.need > r.got + 0.3);
    const cut = ellipsised(panel);
    ok('D no label is ellipsised', cut.length === 0,
        cut.map(r => `${r.txt} ${r.need.toFixed(1)}>${r.got.toFixed(1)}`).join(' | '));
    const partial = [...panel.children].filter(n => {
        const r = n.getBoundingClientRect();
        return r.height > 4 && (r.bottom > plate.bottom + 1 || r.top < plate.top - 1);
    });
    ok('D no row is cut by the plate', partial.length === 0,
        partial.map(n => (n.className || n.id).split(' ')[0]).join(','));

    // Hit-test the rows rather than calling click(): the invisible-region bug (R89) is exactly what a
    // layout-only assertion misses. Disabled rows are excluded on purpose — 亮度：跟系统 carries
    // `pointer-events:none` and 0.55 opacity because there is nothing to reset (R70-1 made that state
    // legible rather than clickable), and counting it here would report a broken panel.
    const rows = [...panel.querySelectorAll('button, a')].filter(n => cs(n, 'display') !== 'none');
    const live = rows.filter(n => !n.disabled);
    const inert = rows.filter(n => n.disabled).map(n => n.id || (n.textContent || '').trim().slice(0, 8));
    const dead = live.filter(n => {
        const r = n.getBoundingClientRect();
        if (r.height < 4) return false;
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !(hit === n || n.contains(hit));
    });
    ok(`D all ${live.length} enabled rows answer to a tap at their centre`, dead.length === 0,
        dead.map(n => (n.id || n.className).split(' ')[0]).join(','));
    ok('D the only inert rows are the ones that should be', inert.every(i => i === 'brightnessRowBtn'),
        `disabled=${inert.join(',')}`);
    const short = rows.filter(n => n.getBoundingClientRect().height < 37.5).map(n => (n.textContent || '').trim().slice(0, 8));
    ok('D every row is at least the 38dp sideways target', short.length === 0, short.join(','));

    const gap = bar.getBoundingClientRect().top - plate.bottom;
    ok('D sideways it also sits one intended gap above the bar', Math.abs(gap - 12) <= 1.5, `${gap.toFixed(1)} px`);
    const safeTopPx = parseFloat(cs(document.documentElement, '--safe-top')) || 0;
    ok('D the sheet stays under the status bar', plate.top >= safeTopPx - 0.5, `top=${plate.top.toFixed(1)} safeTop=${safeTopPx}`);

    // Sideways the transport row has ~1000 px, so the switcher belongs inline — checked above, before
    // the sheet went up.

    return { orient: `${innerWidth}x${innerHeight}`, height: plate.height.toFixed(1), pass: out.pass.length, fail: out.fail, passes: out.pass };
})()
