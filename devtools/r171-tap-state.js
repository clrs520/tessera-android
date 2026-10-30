(() => {
    const v = window.viewer;
    const r = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return {
            x: b.left + b.width / 2, y: b.top + b.height / 2,
            w: b.width, h: b.height, left: b.left, right: b.right, top: b.top, bottom: b.bottom,
        };
    };
    const seg = document.querySelector('#eventTypeSegments .choice-segment[data-mode="SentryClips"]');
    const dateChips = [...document.querySelectorAll('#dateChips .date-chip')].filter((c) => c.dataset.date);
    const l = v.dom.fileList.getBoundingClientRect();
    return JSON.stringify({
        dpr: window.devicePixelRatio,
        open: v.dom.sidebar.classList.contains('filters-open'),
        width: v.dom.filterStack.getBoundingClientRect().width,
        inert: !!v.dom.filterStack.inert,
        funnel: r(v.dom.filterToggleBtn),
        funnelDisplay: getComputedStyle(v.dom.filterToggleBtn).display,
        collapse: r(v.dom.filterCollapseBtn),
        reset: r(v.dom.filterResetBtn),
        resetDisabled: v.dom.filterResetBtn.disabled,
        seg: r(seg),
        date: r(dateChips[0]),
        calendar: r(v.dom.filterCalendarBtn),
        calDisplay: getComputedStyle(v.dom.filterCalendarBtn).display,
        count: v.dom.filterCount.textContent,
        summary: (document.getElementById('filterSummary')?.textContent || '').replace(/\s+/g, ' ').trim(),
        events: v.lastListStats?.events ?? null,
        total: v.eventGroups.length,
        type: v.dom.eventFilter.value,
        dateValue: v.dom.dateFilter.value,
        tagHidden: v.dom.filterSummaryTag.hidden,
        fpOpen: !!v.flatpickrInstance?.isOpen,
        fpRect: v.flatpickrInstance?.calendarContainer ? r(v.flatpickrInstance.calendarContainer) : null,
        list: { left: l.left, width: l.width, top: l.top, height: l.height },
    });
})()
