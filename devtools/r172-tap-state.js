(() => {
    const v = window.viewer;
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), right: +b.right.toFixed(2), bottom: +b.bottom.toFixed(2) }; };
    const cs = (el) => getComputedStyle(el);
    const sidebar = v.dom.sidebar;
    const stack = document.querySelector('.filter-stack');
    const scrim = document.getElementById('pickerScrim');
    const cal = document.querySelector('.flatpickr-calendar.open');
    const badge = document.getElementById('clipLoadingBadge');
    const calBtn = document.getElementById('filterCalendarBtn');
    const br = badge.getBoundingClientRect();
    const day = document.querySelector('.flatpickr-calendar.open .flatpickr-day.selected');
    return JSON.stringify({
        viewport: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        drawerOpen: !sidebar.classList.contains('collapsed'),
        filtersOpen: sidebar.classList.contains('filters-open'),
        sheet: r(stack),
        cal: cal ? r(cal) : null,
        calDay: day ? { text: day.textContent, aria: day.getAttribute('aria-label') } : null,
        // The cell a finger should land on for the date parked in `window.__r172Target`.
        dayTarget: (() => {
            const want = window.__r172Target;
            if (!want || !cal) return null;
            const num = String(Number(want.slice(8, 10)));
            const cell = Array.from(cal.querySelectorAll('.flatpickr-day'))
                .find((c) => c.textContent.trim() === num
                    && !c.classList.contains('prevMonthDay') && !c.classList.contains('nextMonthDay'));
            return cell ? r(cell) : null;
        })(),
        scrim: { display: cs(scrim).display, bg: cs(scrim).backgroundColor, z: cs(scrim).zIndex,
                 rect: r(scrim), shown: scrim.classList.contains('show') },
        badge: { rect: r(badge), centre: +(br.x + br.width / 2).toFixed(1), shown: badge.classList.contains('show') },
        videoColumnLeft: Math.max(sidebar.getBoundingClientRect().right, stack.getBoundingClientRect().right),
        funnel: r(document.getElementById('filterToggleBtn')),
        calBtn: r(calBtn),
        collapse: r(document.getElementById('filterCollapseBtn')),
        chips: Array.from(document.querySelectorAll('.date-chip')).map((c) => ({ date: c.dataset.date,
            text: c.textContent, active: c.classList.contains('is-active'), rect: r(c) })),
        dateValue: v.dom.dateFilter.value,
        layers: v.phoneLayerCount(),
        events: v.eventGroups.length,
        shown: v.lastListStats ? v.lastListStats.events : null,
        // The list keeps a swipe-action row off-screen; picking "the first card in the DOM" would
        // tap at a negative x and the finger would land nowhere. Take the second on-screen row:
        // the boot restore opens the newest clip, so the first row is the one most likely to
        // already be playing — and tapping the open clip short-circuits the load, so the pill
        // would correctly never appear.
        firstCard: (() => {
            const rows = Array.from(document.querySelectorAll('#fileList .video-card')).filter((el) => {
                const b = el.getBoundingClientRect();
                return b.width > 40 && b.x >= 0 && b.y >= 0 && b.bottom <= innerHeight
                    && el.dataset.eventId !== (v.currentEvent && v.currentEvent.eventId);
            });
            const c = rows[1] || rows[0];
            return c ? r(c) : null;
        })(),

    });
})()
