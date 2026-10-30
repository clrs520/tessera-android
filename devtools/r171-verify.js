// R171 — landscape filter sheet: flush fold-out, shared top bar, insight content, no list reflow.
// Run in the landscape phone layout with the drawer open. Real taps on the funnel/collapse live in
// r171-tap.mjs; this suite drives the same methods and asserts geometry and content.
(async () => {
    const v = window.viewer;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const rect = (el) => el.getBoundingClientRect();
    const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
    // The 505-row fixture keeps the main thread busy with thumbnails right after a load; a fixed
    // sleep can land before the 240ms fold has even started. Poll the width instead.
    const settle = async (test, ms = 1600) => {
        const until = performance.now() + ms;
        while (performance.now() < until) {
            if (test()) return true;
            await wait(60);
        }
        return test();
    };

    const landscape = window.innerWidth > window.innerHeight
        && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches;
    check('landscape phone geometry', landscape, `${window.innerWidth}x${window.innerHeight}`);
    check('touch-ui shell class', document.documentElement.classList.contains('touch-ui'),
        document.documentElement.className);

    if (!v.eventGroups.length) {
        const dir = v.lastScannedPath || localStorage.getItem('tdashcam.mediaDir') || '/sdcard/TeslaCamReg2';
        await v.loadTauriDirectory(dir);
        await wait(400);
    }
    check('events are loaded', v.eventGroups.length > 0, `${v.eventGroups.length} events`);

    // The AVD fixture is a single day; the histogram and the date row exist to separate days.
    // Clone the real rows onto the six previous days for the content checks, then put the real
    // list back before the scroll/language pass. Nothing is written to the device.
    const realEvents = v.eventGroups;
    const realDays = new Set(realEvents.map((e) => e.startTime.slice(0, 10)));
    const pad = (n) => String(n).padStart(2, '0');
    if (realDays.size < 3) {
        const [y, m, d] = [...realDays][0].split('-').map(Number);
        const clones = [];
        for (let back = 1; back <= 6; back += 1) {
            const day = new Date(y, m - 1, d - back);
            const key = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
            for (let k = 0; k < 2; k += 1) {
                const src = realEvents[(back * 2 + k) % realEvents.length];
                clones.push({
                    ...src,
                    eventId: `${src.eventId}#r171-${back}-${k}`,
                    startTime: `${key}_${pad(10 + k)}-00-00`,
                    segments: src.segments,
                    bytes: src.bytes || 1024,
                });
            }
        }
        v.eventGroups = [...realEvents, ...clones];
        v.filterAndRender();
        await wait(80);
    }
    check('multi-day fixture for the histogram', new Set(v.eventGroups.map((e) => e.startTime.slice(0, 10))).size >= 3,
        `${new Set(v.eventGroups.map((e) => e.startTime.slice(0, 10))).size} days`);

    const sidebar = v.dom.sidebar;
    if (sidebar.classList.contains('collapsed')) { v.toggleSidebar(true); await wait(360); }
    check('drawer open', !sidebar.classList.contains('collapsed'), sidebar.className);

    // ── closed ──────────────────────────────────────────────────────────────────────────────
    v.setFiltersOpen(false, false);
    const stack = v.dom.filterStack;
    const funnel = v.dom.filterToggleBtn;
    await settle(() => rect(stack).width <= 0.5);
    check('closed: sheet width 0', near(rect(stack).width, 0), `${rect(stack).width}px`);
    check('closed: sheet is inert', stack.inert === true, `inert=${stack.inert}`);
    check('closed: funnel visible', getComputedStyle(funnel).display !== 'none',
        getComputedStyle(funnel).display);
    const closedHead = getComputedStyle(v.dom.sidebar.querySelector('.sidebar-header'));
    // R171 reserves the 1px line so the list height does not change when the sheet opens; closed
    // it must be transparent, not a visible rule.
    // `.sidebar-header` transitions border-color over 300ms, so a just-folded sheet can still read
    // a few percent of alpha; anything at or below 0.1 is invisible and on its way to zero.
    const closedAlpha = /rgba\([^)]*,\s*([\d.]+)\)$/.exec(closedHead.borderBottomColor);
    check('closed: header has no visible divider',
        parseFloat(closedHead.borderBottomWidth) === 0
        || (closedAlpha && Number(closedAlpha[1]) <= 0.1),
        `${closedHead.borderBottomWidth} ${closedHead.borderBottomColor}`);

    const list = v.dom.fileList;
    const before = { r: rect(list), cards: list.querySelectorAll('.video-card').length, top: v.videoListComponent.container.scrollTop };

    // ── open ───────────────────────────────────────────────────────────────────────────────
    v.setFiltersOpen(true, false);
    await settle(() => near(rect(stack).width, 340, 1));
    const sr = rect(sidebar);
    const kr = rect(stack);
    const cs = getComputedStyle(stack);
    const drawerEdge = parseFloat(getComputedStyle(sidebar).borderRightWidth) || 0;
    const sheetEdge = parseFloat(cs.borderLeftWidth) || 0;
    check('open: sheet is 340 wide', near(kr.width, 340, 1), `${kr.width}px`);
    // `left:100%` resolves against the drawer's padding box, so the sheet's own border sits exactly
    // over the drawer's border-right: one divider, no gap and no doubled line.
    check('open: flush with the drawer',
        near(kr.left, sr.right - drawerEdge, 0.6) && near(kr.left + sheetEdge, sr.right, 0.6),
        `sheet.left=${kr.left} + border=${sheetEdge} vs drawer.right=${sr.right} (drawer border=${drawerEdge})`);
    check('open: full height', near(kr.top, 0, 0.6) && near(kr.bottom, window.innerHeight, 1),
        `top=${kr.top} bottom=${kr.bottom} vh=${window.innerHeight}`);
    check('open: square, flat, one divider',
        cs.borderTopLeftRadius === '0px' && cs.boxShadow === 'none' && sheetEdge > 0.5 && sheetEdge <= 1.5,
        `radius=${cs.borderTopLeftRadius} shadow=${cs.boxShadow} border=${cs.borderLeftWidth}`);
    check('open: not inert and gets pointers', stack.inert === false && cs.pointerEvents === 'auto',
        `inert=${stack.inert} pe=${cs.pointerEvents}`);
    check('open: funnel yields to 收起', getComputedStyle(funnel).display === 'none',
        getComputedStyle(funnel).display);
    const head = v.dom.sidebar.querySelector('.sidebar-header');
    const sheetHead = stack.querySelector('.filter-sheet-head');
    check('open: shared top-bar height',
        Math.abs(rect(head).height - rect(sheetHead).height) <= 1.5,
        `drawer=${rect(head).height} sheet=${rect(sheetHead).height}`);
    const headRule = parseFloat(getComputedStyle(head).borderBottomWidth) || 0;
    const sheetRule = parseFloat(getComputedStyle(sheetHead).borderBottomWidth) || 0;
    check('open: divider line is continuous', headRule > 0.5 && near(headRule, sheetRule, 0.1),
        `drawer=${headRule} sheet=${sheetRule}`);

    // The drawer's own list must not move or rebuild when the sheet unfolds.
    const after = { r: rect(list), cards: list.querySelectorAll('.video-card').length, top: v.videoListComponent.container.scrollTop };
    check('list did not reflow', near(before.r.width, after.r.width) && near(before.r.left, after.r.left)
        && near(before.r.height, after.r.height), `${before.r.width}x${before.r.height} → ${after.r.width}x${after.r.height}`);
    check('list kept its rows and scroll', before.cards === after.cards && before.top === after.top,
        `cards ${before.cards}→${after.cards} scroll ${before.top}→${after.top}`);

    // ── content ───────────────────────────────────────────────────────────────────────────
    const segments = [...document.querySelectorAll('#eventTypeSegments .choice-segment')];
    check('type segments present', segments.length === 4, `${segments.length}`);
    check('date chips present', document.querySelectorAll('#dateChips .date-chip').length >= 1,
        `${document.querySelectorAll('#dateChips .date-chip').length}`);
    const cal = v.dom.filterCalendarBtn;
    check('calendar chip is 40x40 and visible',
        near(rect(cal).width, 40) && near(rect(cal).height, 40) && getComputedStyle(cal).display !== 'none',
        `${rect(cal).width}x${rect(cal).height}`);

    const bars = [...document.querySelectorAll('#filterDayChart .filter-day-bar')];
    check('day histogram has bars', bars.length >= 1 && bars.length <= 7, `${bars.length}`);
    const barCounts = bars.map((b) => Number(b.querySelector('b').textContent));
    check('histogram values are numbers', barCounts.every((n) => Number.isFinite(n) && n > 0),
        barCounts.join(','));
    check('histogram labels read MM-DD', bars.every((b) => /^\d{2}-\d{2}$/.test(b.querySelector('span').textContent)),
        bars.map((b) => b.querySelector('span').textContent).join(','));

    const sourceChips = [...document.querySelectorAll('#recentDirs .recent-chip')];
    // Only the chips the source fold (C9, 1.2.278) leaves up can be measured — the hidden ones
    // report 0×0, and asserting on them made this criterion reject a correct layout. My first guess
    // here blamed the sheet's 1 px border and passed for the wrong reason; the widths say otherwise.
    const shownChips = sourceChips.filter((c) => rect(c).width > 0);
    check('source cards are stacked rows', shownChips.length >= 1
        && shownChips.every((c) => near(rect(c).width, 340 - 24, 1.5)),
        `${sourceChips.length} 个来源，露出 ${shownChips.length} 个，宽 ${shownChips.map((c) => Math.round(rect(c).width)).join('/')}`);
    const current = sourceChips.find((c) => c.classList.contains('on'));
    check('current source is marked', !!current, sourceChips.map((c) => c.textContent).join(' | '));
    check('current source shows scanned media size',
        !!current && /[KMGTP]?B$/.test((current.querySelector('.src-meta') || { textContent: '' }).textContent.trim()),
        current ? (current.querySelector('.src-meta') || { textContent: '(无 .src-meta)' }).textContent : 'none');

    // Removed: this asked the fixed footer for the same count, and R174 deleted that footer (the
    // count lives in the sheet head now, checked just below). Reading the dead node back took the
    // whole suite down with an `undefined.textContent`, which is how a stale probe hides a green.
    check('head count names the result', v.dom.filterCount.textContent.includes(String(v.lastListStats.events)),
        v.dom.filterCount.textContent);
    check('reset is disabled with no filters', v.dom.filterResetBtn.disabled === !v.hasActiveFilters(),
        `disabled=${v.dom.filterResetBtn.disabled} active=${v.hasActiveFilters()}`);
    check('filter tag hidden with no filters', v.dom.filterSummaryTag.hidden === !v.hasActiveFilters(),
        `hidden=${v.dom.filterSummaryTag.hidden}`);

    // ── type filter ───────────────────────────────────────────────────────────────────────
    const allEvents = v.eventGroups.length;
    const sentry = v.eventGroups.filter((e) => e.eventType === 'SentryClips').length;
    const beforeEvents = v.lastListStats.events;
    const sentrySeg = segments.find((s) => s.dataset.mode === 'SentryClips');
    sentrySeg.click();
    await wait(120);
    check('type tap changes the list', v.lastListStats.events === sentry && sentry !== beforeEvents,
        `${beforeEvents} → ${v.lastListStats.events} (sentry ${sentry})`);
    check('type segment selected', sentrySeg.getAttribute('aria-checked') === 'true',
        sentrySeg.getAttribute('aria-checked'));
    check('head names the type', /哨兵|Sentry/.test(v.dom.filterCount.textContent),
        v.dom.filterCount.textContent);
    // Same stale node as above: the footer is gone since R174, so the filtered count is read from
    // the sheet head, which is where it lives now.
    check('筛选之后顶部计数跟着变', String(v.dom.filterCount.textContent).includes(String(sentry)),
        v.dom.filterCount.textContent);
    check('reset and tag turn on', !v.dom.filterResetBtn.disabled && !v.dom.filterSummaryTag.hidden,
        `disabled=${v.dom.filterResetBtn.disabled} hidden=${v.dom.filterSummaryTag.hidden}`);
    const expectDays = new Map();
    for (const e of v.eventGroups.filter((e) => e.eventType === 'SentryClips')) {
        const d = e.startTime.slice(0, 10);
        expectDays.set(d, (expectDays.get(d) || 0) + 1);
    }
    const recentDays = [...expectDays.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7);
    const shownBars = [...document.querySelectorAll('#filterDayChart .filter-day-bar b')].map((b) => Number(b.textContent));
    check('histogram counts the selected type, not the list',
        JSON.stringify(shownBars) === JSON.stringify(recentDays.map(([, n]) => n)),
        `bars=${shownBars.join(',')} expected=${recentDays.map(([, n]) => n).join(',')}`);

    // ── date chip ─────────────────────────────────────────────────────────────────────────
    const dateChips = [...document.querySelectorAll('#dateChips .date-chip')];
    const dayChip = dateChips.find((c) => c.dataset.date && c.dataset.date !== v.dom.dateFilter.value);
    let dayCount = -1;
    if (dayChip) {
        const day = dayChip.dataset.date;
        dayCount = v.eventGroups.filter((e) => e.eventType === 'SentryClips' && e.startTime.startsWith(day)).length;
        dayChip.click();
        await wait(120);
        check('date chip filters to that day', v.lastListStats.events === dayCount,
            `${v.lastListStats.events} vs ${dayCount} on ${day}`);
        check('date chip marked active', dayChip.classList.contains('is-active'),
            dayChip.className);
        const barsAfter = [...document.querySelectorAll('#filterDayChart .filter-day-bar')];
        check('histogram keeps the other days visible', barsAfter.length === bars.length,
            `${bars.length} → ${barsAfter.length}`);
    } else {
        check('a second day exists to filter by', false, 'only one date chip');
    }

    // ── reset ─────────────────────────────────────────────────────────────────────────────
    if (!v.dom.filterResetBtn.disabled) { v.dom.filterResetBtn.click(); await wait(120); }
    else v.clearFilters();
    check('reset restores the whole list', v.lastListStats.events === allEvents,
        `${v.lastListStats.events} vs ${allEvents}`);
    check('reset clears the type', v.dom.eventFilter.value === '', `type=${v.dom.eventFilter.value}`);
    check('reset clears the date', v.dom.dateFilter.value === '', `date=${v.dom.dateFilter.value}`);
    check('reset disables itself again', v.dom.filterResetBtn.disabled === true,
        `disabled=${v.dom.filterResetBtn.disabled}`);
    check('all-dates chip is the one lit',
        document.querySelector('#dateChips .date-chip[data-date=""]').classList.contains('is-active'),
        [...document.querySelectorAll('#dateChips .date-chip.is-active')].map((c) => c.dataset.date).join(','));

    // Back to the rows the device really has before the scroll/language checks.
    if (realEvents !== v.eventGroups) { v.eventGroups = realEvents; v.filterAndRender(); await wait(100); }

    // ── collapse ──────────────────────────────────────────────────────────────────────────
    v.dom.filterCollapseBtn.click();
    await settle(() => rect(stack).width <= 0.5);
    check('收起 folds the sheet away', near(rect(stack).width, 0) && stack.inert === true,
        `${rect(stack).width}px inert=${stack.inert}`);
    check('收起 gives the funnel back', getComputedStyle(funnel).display !== 'none',
        getComputedStyle(funnel).display);
    funnel.click();
    await settle(() => near(rect(stack).width, 340, 1));
    check('funnel unfolds it again', near(rect(stack).width, 340) && stack.inert === false,
        `${rect(stack).width}px inert=${stack.inert}`);

    // ── loading badge ─────────────────────────────────────────────────────────────────────
    const badge = v.dom.clipLoadingBadge;
    v.playEventLoadingId = '__r171__';
    v.armClipLoadingBadge('__r171__');
    const badgeUp = await settle(() => badge.classList.contains('show')
        && Number(getComputedStyle(badge).opacity) > 0.9, 1600);
    check('slow switch raises the loading badge', badgeUp,
        `${getComputedStyle(badge).visibility} ${getComputedStyle(badge).opacity}`);
    check('loading badge never eats pointers', getComputedStyle(badge).pointerEvents === 'none',
        getComputedStyle(badge).pointerEvents);
    v.playEventLoadingId = null;
    v.clearClipLoadingBadge('__r171__');
    const badgeDown = await settle(() => !badge.classList.contains('show')
        && getComputedStyle(badge).visibility === 'hidden', 800);
    check('badge leaves when the load ends', badgeDown, getComputedStyle(badge).visibility);
    // A fast load must not flash it.
    v.playEventLoadingId = '__r171fast__';
    v.armClipLoadingBadge('__r171fast__');
    await wait(120);
    const early = badge.classList.contains('show');
    v.playEventLoadingId = null;
    v.clearClipLoadingBadge('__r171fast__');
    check('fast load never flashes the badge', early === false, `shown=${early}`);

    // ── language + scroll ─────────────────────────────────────────────────────────────────
    v.setLanguage('zh');
    await wait(80);
    list.scrollTop = Math.min(260, Math.max(0, list.scrollHeight - list.clientHeight));
    const scrollBefore = list.scrollTop;
    const cardBefore = list.querySelector('.video-card')?.innerText.replace(/\s+/g, ' ').trim() || '';
    v.setLanguage('en');
    await wait(160);
    const cardAfter = list.querySelector('.video-card')?.innerText.replace(/\s+/g, ' ').trim() || '';
    check('language flip rebuilds the visible cards', cardBefore !== cardAfter && cardAfter.length > 0,
        `${cardBefore.slice(0, 36)} → ${cardAfter.slice(0, 36)}`);
    check('language flip keeps the list position', near(list.scrollTop, scrollBefore, 2),
        `${scrollBefore} → ${list.scrollTop}`);
    v.setLanguage('zh');
    await wait(120);
    check('language flip back restores the rows', (list.querySelector('.video-card')?.innerText || '').includes('哨兵')
        || (list.querySelector('.video-card')?.innerText || '').includes('保存')
        || (list.querySelector('.video-card')?.innerText || '').includes('最近'),
        (list.querySelector('.video-card')?.innerText || '').replace(/\s+/g, ' ').slice(0, 40));

    // ── RecentClips split (already existed; verify only) ─────────────────────────────────
    const splitChoice = document.getElementById('recentSplitChoice');
    check('RecentClips split setting exists', !!splitChoice
        && splitChoice.querySelectorAll('.choice-segment').length === 3,
        splitChoice ? `${splitChoice.querySelectorAll('.choice-segment').length} segments, mode=${v.recentSplit()}` : 'missing');

    return JSON.stringify({
        pass: checks.filter((c) => c.ok).length,
        fail: checks.filter((c) => !c.ok).length,
        failures: checks.filter((c) => !c.ok),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        drawer: `${Math.round(sr.width)}x${Math.round(sr.height)}`,
        sheet: `${Math.round(kr.width)}x${Math.round(kr.height)}`,
    });
})()
