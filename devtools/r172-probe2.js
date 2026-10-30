// R172 pre-flight evidence, part 2: same five candidates, but measured from a state the user
// can actually reach (drawer open, sheet open) and with the off-list date really applied
// through flatpickr's onChange.
(() => {
    const v = window.viewer;
    const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
                 right: +r.right.toFixed(2), bottom: +r.bottom.toFixed(2) };
    };
    const cs = (el) => getComputedStyle(el);
    const out = { viewport: [innerWidth, innerHeight] };
    const sidebar = v.dom.sidebar;
    if (sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    v.setFiltersOpen(true, false);

    // ---- A: sheet children vs the stack's content box --------------------------------
    const stack = document.querySelector('.filter-stack');
    const head = document.querySelector('.filter-sheet-head');
    const body = document.querySelector('.filter-sheet-body');
    const foot = document.querySelector('.filter-sheet-foot');
    out.sheet = {
        stack: rect(stack), stackClientW: stack.clientWidth, borderLeft: cs(stack).borderLeftWidth,
        head: rect(head), body: rect(body), foot: rect(foot),
        bodyScrollW: body.scrollWidth, bodyClientW: body.clientWidth,
        bodyScrollH: body.scrollHeight, bodyClientH: body.clientHeight, hasMore: body.classList.contains('has-more'),
        sourceRows: Array.from(body.querySelectorAll('.recent-chip')).map((c) => ({ name: c.textContent.trim().slice(0, 24), rect: rect(c) })),
    };

    // ---- E: badge centred on what? ---------------------------------------------------
    const badge = document.getElementById('clipLoadingBadge');
    badge.classList.add('show');
    const b = rect(badge);
    const video = document.querySelector('#multiCameraPlayer') || document.querySelector('.video-container');
    out.badge = { rect: b, centre: +(b.x + b.w / 2).toFixed(1), videoRect: rect(video),
                  videoCentre: video ? +(video.getBoundingClientRect().x + video.getBoundingClientRect().width / 2).toFixed(1) : null,
                  hit: document.elementFromPoint(b.x + b.w / 2, b.y + b.h / 2)?.id || null,
                  offsetParent: badge.offsetParent ? (badge.offsetParent.id || badge.offsetParent.className) : null };
    badge.classList.remove('show');

    // ---- C: back gesture with the calendar open --------------------------------------
    v.flatpickrInstance.open();
    const cal = document.querySelector('.flatpickr-calendar.open');
    out.calendar = { rect: rect(cal), zIndex: cal ? cs(cal).zIndex : null,
                     layerCount: v.phoneLayerCount(),
                     drawerOpen: !sidebar.classList.contains('collapsed'),
                     filtersOpen: sidebar.classList.contains('filters-open') };
    const consumed = v.closeTopLayer();
    out.backPress = { consumed, after: { calendarOpen: !!document.querySelector('.flatpickr-calendar.open'),
                                          drawerOpen: !sidebar.classList.contains('collapsed'),
                                          layerCount: v.phoneLayerCount() } };

    // ---- D: an off-list date applied the way a finger applies one --------------------
    v.flatpickrInstance.setDate('2026-10-19', true);   // trigger onChange → filterAndRender
    const chips = Array.from(document.querySelectorAll('.date-chip'));
    const calBtn = document.getElementById('filterCalendarBtn');
    const activeChip = chips.filter((c) => c.classList.contains('is-active')).map((c) => c.textContent);
    out.offListDate = { input: v.dom.dateFilter.value, chipDates: chips.map((c) => c.dataset.date),
                        activeChip, chipCount: chips.length,
                        calBtnBg: cs(calBtn).backgroundColor, calBtnCls: calBtn.className,
                        listEmpty: (v.dom.fileList.querySelector('.empty-state') || {}).textContent?.trim().slice(0, 30) || null,
                        events: v.eventGroups.length, shown: v.lastListStats?.events ?? null,
                        headCount: document.getElementById('filterCount').textContent };
    // restore
    v.flatpickrInstance.clear();
    v.flatpickrInstance.close();
    v.setFiltersOpen(false, false);
    return JSON.stringify(out);
})()
