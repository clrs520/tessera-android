// R172 — the six findings that reproduced on 1.2.276, written as criteria before the fix.
// Run in the landscape phone layout with the drawer open. Each check measures what the user
// would see (computed style / rendered rect), not a JS flag.
(async () => {
    const v = window.viewer;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const rect = (el) => el.getBoundingClientRect();
    const cs = (el) => getComputedStyle(el);
    const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
    const settle = async (test, ms = 1600) => {
        const until = performance.now() + ms;
        while (performance.now() < until) {
            if (test()) return true;
            await wait(60);
        }
        return test();
    };

    check('landscape phone geometry', window.innerWidth > window.innerHeight
        && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches,
        `${window.innerWidth}x${window.innerHeight}`);
    if (!v.eventGroups.length) {
        await v.loadTauriDirectory(v.lastScannedPath || localStorage.getItem('tdashcam.mediaDir'));
        await wait(400);
    }
    check('events are loaded', v.eventGroups.length > 0, `${v.eventGroups.length}`);

    const sidebar = v.dom.sidebar;
    const stack = document.querySelector('.filter-stack');
    const body = document.querySelector('.filter-sheet-body');
    const openAll = async () => {
        if (sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
        v.setFiltersOpen(true, false);
        await settle(() => near(rect(stack).width, 340, 1));
        await wait(120);
    };
    await openAll();
    check('前置：抽屉与整面都开着', !sidebar.classList.contains('collapsed')
        && sidebar.classList.contains('filters-open') && near(rect(stack).width, 340, 1),
        `sheet=${rect(stack).width.toFixed(2)}`);

    // ---- 1 · the sheet's own sections must not be clipped by its border --------------
    // The stack keeps a 1px left border while open, so its content box is 0.76px narrower
    // than --sheet-w; children sized to var(--sheet-w) overflowed and lost that sliver.
    for (const sel of ['.filter-sheet-head', '.filter-sheet-body', '.filter-sheet-foot']) {
        const el = stack.querySelector(sel);
        const over = rect(el).right - rect(stack).right;
        check(`${sel} 不被面的右边裁掉`, over <= 0.02,
            `child.right=${rect(el).right.toFixed(2)} stack.right=${rect(stack).right.toFixed(2)} over=${over.toFixed(3)}`);
    }

    // ---- 2 · the bottom fade has to follow the fold, not the last render -------------
    // The stale case a finger actually hits: the drawer was collapsed (the sheet is
    // `display:none`, so the body has no height and the fade is off), a render ran there, and
    // then the drawer and the sheet were opened without any filter change.
    const hiddenOf = () => body.scrollHeight - body.clientHeight;
    v.setFiltersOpen(false, false);
    v.toggleSidebar(false);
    await wait(80);
    v.updateFilterScrollFade();                      // what the last render computed while hidden
    check('前置：收起时渐隐是关的', !body.classList.contains('has-more'),
        `hidden=${hiddenOf()} display=${getComputedStyle(stack).display}`);
    v.toggleSidebar(true);
    await openAll();
    const hidden = hiddenOf();
    check('前置：面内确实有折不尽的内容', hidden > 40, `hidden=${hidden}px`);
    check('折不尽时底缘渐隐亮着', body.classList.contains('has-more')
        && cs(body).maskImage !== 'none', `has-more=${body.classList.contains('has-more')} mask=${cs(body).maskImage.slice(0, 24)}`);
    body.scrollTop = body.scrollHeight;
    await wait(120);
    check('滚到底后渐隐收起', !body.classList.contains('has-more'), `scrollTop=${body.scrollTop}`);
    body.scrollTop = 0;
    await wait(80);

    // ---- 3 · the loading pill is centred on the picture, not the viewport ------------
    // Nothing needs to be playing: the picture column is whatever is left of the screen once the
    // drawer (and, when open, the sheet) has taken its strip. `elementFromPoint` would answer
    // "what is on top here" (the full-screen `#overlay`), not "what this pill belongs to".
    const badge = document.getElementById('clipLoadingBadge');
    const columnLeft = rect(stack).right;
    const columnCentre = columnLeft + (innerWidth - columnLeft) / 2;
    // Show it the way a tap does: the pill's placement is computed on the arm path, so toggling
    // the class by hand would measure a badge the product never paints.
    v.playEventLoadingId = 'r172-probe';
    v.armClipLoadingBadge('r172-probe');
    await wait(380);
    const br = rect(badge);
    check('载入角标对准画面列中线', badge.classList.contains('show')
        && Math.abs(br.x + br.width / 2 - columnCentre) <= 8,
        `shown=${badge.classList.contains('show')} badge=${(br.x + br.width / 2).toFixed(1)} column=${columnCentre.toFixed(1)}`);
    check('载入角标整块落在画面列内', br.x >= columnLeft - 1 && br.right <= innerWidth + 1,
        `x=${br.x.toFixed(1)} right=${br.right.toFixed(1)} columnLeft=${columnLeft.toFixed(1)}`);
    v.clearClipLoadingBadge('r172-probe');
    v.playEventLoadingId = null;

    // ---- 4 · the calendar is a layer of its own for the back gesture -----------------
    v.flatpickrInstance.close();
    await wait(60);
    const baseLayers = v.phoneLayerCount();
    v.flatpickrInstance.open();
    await wait(80);
    const cal = document.querySelector('.flatpickr-calendar.open');
    check('日历打开后多算一层', v.phoneLayerCount() === baseLayers + 1,
        `${baseLayers} → ${v.phoneLayerCount()}`);
    const scrim = document.getElementById('pickerScrim');
    check('日历背后有一层遮罩', !!scrim && cs(scrim).display !== 'none'
        && rect(scrim).width >= innerWidth - 1 && rect(scrim).height >= innerHeight - 1
        && parseFloat(cs(scrim).opacity || '1') > 0.2,
        scrim ? `display=${cs(scrim).display} ${rect(scrim).width.toFixed(0)}x${rect(scrim).height.toFixed(0)}` : 'missing');
    check('遮罩压在日历之下、抽屉之上', !!scrim && !!cal
        && Number(cs(scrim).zIndex) < Number(cs(cal).zIndex) && Number(cs(scrim).zIndex) > 2,
        scrim && cal ? `scrim=${cs(scrim).zIndex} cal=${cs(cal).zIndex}` : 'n/a');
    // Computed z-indexes in different parents do not prove painting order; the hit test does.
    const calCentre = cal ? document.elementFromPoint(rect(cal).x + rect(cal).width / 2,
        rect(cal).y + 12) : null;
    check('日历仍可点，遮罩没有盖住它', !!calCentre && !!cal && cal.contains(calCentre),
        calCentre ? (calCentre.className || calCentre.id || calCentre.tagName).slice(0, 30) : 'null');
    check('遮罩铺满整屏并拦住底下的列表', (() => {
        if (!scrim) return false;
        const hit = document.elementFromPoint(60, 200);
        return hit === scrim || (hit && hit.id === 'pickerScrim');
    })(), (() => { const h = scrim ? document.elementFromPoint(60, 200) : null;
        return h ? (h.id || h.className || h.tagName).slice(0, 30) : 'null'; })());
    const consumed = v.closeTopLayer();
    await wait(120);
    check('返回键先关日历、不带走抽屉', consumed === true
        && !document.querySelector('.flatpickr-calendar.open')
        && !sidebar.classList.contains('collapsed') && sidebar.classList.contains('filters-open'),
        `consumed=${consumed} cal=${!!document.querySelector('.flatpickr-calendar.open')} drawer=${!sidebar.classList.contains('collapsed')}`);
    check('日历关了遮罩跟着消失', !!scrim && cs(scrim).display === 'none',
        scrim ? `display=${cs(scrim).display}` : 'missing');
    // The scrim is a tap target for 关闭, and only while the calendar is up.
    v.flatpickrInstance.open();
    await wait(80);
    const openAgain = !!document.querySelector('.flatpickr-calendar.open');
    if (scrim) scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(120);
    check('点遮罩关掉日历', !!scrim && openAgain && !document.querySelector('.flatpickr-calendar.open'),
        `scrim=${!!scrim} wasOpen=${openAgain} stillOpen=${!!document.querySelector('.flatpickr-calendar.open')}`);
    check('点遮罩不动抽屉', !sidebar.classList.contains('collapsed'), sidebar.className);

    // ---- 5 · a date outside the chips still shows where it came from -----------------
    const offList = (() => {
        const days = new Set(v.eventGroups.map((e) => (e.startTime || '').slice(0, 10)));
        const d = new Date(Date.parse([...days][0]) - 26 * 864e5);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    v.flatpickrInstance.setDate(offList, true);
    await wait(120);
    const chip = document.querySelector(`.date-chip[data-date="${offList}"]`);
    check('日历选的日期在 chips 行里有自己的一格', !!chip && chip.classList.contains('is-active'),
        chip ? `${chip.textContent} active=${chip.classList.contains('is-active')}` : `no chip for ${offList}`);
    check('那一格滚到了可见范围内', (() => {
        if (!chip) return false;
        const row = document.getElementById('dateChips');
        const rr = rect(row), cr = rect(chip);
        return cr.left >= rr.left - 1 && cr.right <= rr.right + 1;
    })(), (() => {
        if (!chip) return 'no chip';
        const rr = rect(document.getElementById('dateChips')), cr = rect(chip);
        return `chip ${cr.x.toFixed(0)}..${cr.right.toFixed(0)} row ${rr.x.toFixed(0)}..${rr.right.toFixed(0)}`;
    })());
    check('那一格点了能取消日期筛选', !!chip && (() => {
        chip.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return v.dom.dateFilter.value === '' && !document.querySelector(`.date-chip[data-date="${offList}"]`);
    })(), `value=${v.dom.dateFilter.value} chips=${document.querySelectorAll('.date-chip').length}`);
    // A chip-row date must not grow a duplicate when it is also the selected one.
    const listed = [...new Set(v.eventGroups.map((e) => (e.startTime || '').slice(0, 10)))][0];
    v.flatpickrInstance.setDate(listed, true);
    await wait(120);
    check('列表里已有的日期不重复补格',
        document.querySelectorAll(`.date-chip[data-date="${listed}"]`).length === 1,
        `${document.querySelectorAll(`.date-chip[data-date="${listed}"]`).length} 格`);
    check('在列表内的日期照旧点亮原 chip', (() => {
        const c = document.querySelector(`.date-chip[data-date="${listed}"]`);
        return c && c.classList.contains('is-active');
    })(), '');
    // ---- 6 · portrait keeps its own rules (no scrim, no landscape centring) ----------
    const pickerRules = Array.from(document.styleSheets).flatMap((sh) => {
        try { return Array.from(sh.cssRules); } catch (e) { return []; }
    });
    const scoped = pickerRules.some((r) => r.conditionText && /orientation: landscape/.test(r.conditionText)
        && /\.picker-scrim/.test(r.cssText || ''));
    const hiddenByDefault = pickerRules.some((r) => !r.conditionText
        && /(^|\s)\.picker-scrim\s*\{/.test(r.cssText || '') && /display:\s*none/.test(r.cssText || ''));
    check('遮罩规则只写在横屏手机档里', scoped, `scoped=${scoped}`);
    check('默认（含竖屏与桌面）遮罩是隐藏的', hiddenByDefault, `base display:none=${hiddenByDefault}`);

    // ---- 7 · the picker must not keep the desktop blue -------------------------------
    // `today` only exists in the month being shown, and the previous section left the view on the
    // fixture's September.
    v.flatpickrInstance.jumpToDate(new Date(), false);
    v.flatpickrInstance.open();
    await wait(120);
    const today = document.querySelector('.flatpickr-calendar.open .flatpickr-day.today');
    const accentNow = cs(document.body).getPropertyValue('--accent').trim() || cs(document.documentElement).getPropertyValue('--accent').trim();
    const toRgb = (c) => { const m = /^#([0-9a-f]{6})$/i.exec(c); return m
        ? `rgb(${parseInt(m[1].slice(0, 2), 16)}, ${parseInt(m[1].slice(2, 4), 16)}, ${parseInt(m[1].slice(4, 6), 16)})` : c; };
    check('「今天」那一圈跟的是本机强调色，不是桌面蓝', !!today
        && cs(today).borderTopColor === toRgb(accentNow)
        && cs(today).borderTopColor !== 'rgb(0, 122, 255)' && cs(today).borderTopColor !== 'rgb(0, 123, 255)',
        today ? `ring=${cs(today).borderTopColor} accent=${accentNow}` : 'no today cell');

    // restore
    v.flatpickrInstance.clear();
    v.setFiltersOpen(false, false);
    v.filterAndRender();
    const pass = checks.filter((c) => c.ok).length;
    return JSON.stringify({ pass, fail: checks.length - pass, checks }, null, 1);
})()
