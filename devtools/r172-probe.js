// R172 pre-flight evidence: measure the five candidates on the installed 1.2.276 so the
// round only fixes what actually reproduces. Read-only except the flatpickr open/close and
// the date filter, both restored at the end.
(() => {
    const v = window.viewer;
    const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
                 right: +r.right.toFixed(2), bottom: +r.bottom.toFixed(2) };
    };
    const cs = (el) => getComputedStyle(el);
    const out = {};
    const stack = document.querySelector('.filter-stack');
    const sidebar = v.dom.sidebar;
    const calBtn = document.getElementById('filterCalendarBtn');

    // ---- C: is the landscape calendar a back layer at all? --------------------------
    v.setFiltersOpen(true, false);
    calBtn.click();
    const cal = document.querySelector('.flatpickr-calendar.open');
    out.calendar = {
        found: !!cal,
        position: cal ? cs(cal).position : null,
        rect: rect(cal),
        zIndex: cal ? cs(cal).zIndex : null,
        layerCount: v.phoneLayerCount(),
        scrims: Array.from(document.querySelectorAll('body > *'))
            .filter((el) => /scrim|backdrop/i.test((el.id || '') + ' ' + (el.className || '')))
            .map((el) => el.id || el.className),
    };
    const before = { drawerOpen: !sidebar.classList.contains('collapsed'),
                     calendarOpen: !!document.querySelector('.flatpickr-calendar.open') };
    const consumed = v.closeTopLayer();
    out.backPress = {
        consumed, before,
        after: { drawerOpen: !sidebar.classList.contains('collapsed'),
                 calendarOpen: !!document.querySelector('.flatpickr-calendar.open') },
    };

    // ---- B: the selected day's fill --------------------------------------------------
    const dp = v.flatpickrInstance;
    dp.setDate('2026-10-19', false);
    dp.open();
    const sel = document.querySelector('.flatpickr-calendar.open .flatpickr-day.selected');
    out.selectedDay = sel ? { bg: cs(sel).backgroundColor, color: cs(sel).color,
        accentSolid: cs(document.documentElement).getPropertyValue('--accent-solid').trim() } : null;

    // ---- D: an off-list date leaves no visible trace ---------------------------------
    const chips = Array.from(document.querySelectorAll('.date-chip'));
    out.dateChips = {
        dates: chips.map((c) => c.dataset.date),
        active: chips.filter((c) => c.classList.contains('is-active')).map((c) => c.textContent),
    };
    out.calendarBtnState = { cls: calBtn.className, bg: cs(calBtn).backgroundColor,
                             border: cs(calBtn).borderColor };

    // ---- A: sheet children vs the stack's content box --------------------------------
    const head = document.querySelector('.filter-sheet-head');
    const body = document.querySelector('.filter-sheet-body');
    const foot = document.querySelector('.filter-sheet-foot');
    out.sheetGeometry = {
        stack: rect(stack), stackBorderLeft: cs(stack).borderLeftWidth, stackClientW: stack.clientWidth,
        head: rect(head), body: rect(body), foot: rect(foot),
        bodyScrollW: body.scrollWidth, bodyClientW: body.clientWidth,
        headScrollW: head.scrollWidth,
    };

    // ---- E: the loading badge's landing strip ---------------------------------------
    const badge = document.getElementById('clipLoadingBadge');
    badge.classList.add('show');
    const b = rect(badge);
    out.badge = {
        rect: b,
        hit: b ? (document.elementFromPoint(b.x + b.w / 2, b.y + b.h / 2) || {}).id || null : null,
        videoRect: rect(document.querySelector('#multiCameraPlayer') || document.querySelector('.video-container')),
        offsetParent: badge.offsetParent ? (badge.offsetParent.id || badge.offsetParent.className) : null,
        sheetVisible: cs(stack).width,
    };
    badge.classList.remove('show');

    // restore
    dp.clear();
    dp.close();
    v.setFiltersOpen(false, false);
    v.filterAndRender();
    return JSON.stringify(out);
})()
