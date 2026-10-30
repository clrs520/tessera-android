(async () => {
    const sidebar = document.querySelector('.sidebar');
    const stack = document.querySelector('.filter-stack');
    const active = document.querySelector('#dateChips .date-chip.is-active');
    const cards = Array.from(document.querySelectorAll('#fileList .video-card'));
    const empty = document.querySelector('#fileList .empty-state');
    return JSON.stringify({
        drawerOpen: !sidebar.classList.contains('collapsed'),
        filtersOpen: sidebar.classList.contains('filters-open'),
        stackDisplay: getComputedStyle(stack).display,
        stackPosition: getComputedStyle(stack).position,
        activeDate: active ? active.textContent.trim() : null,
        activeDateValue: active ? active.dataset.date : null,
        cards: cards.length,
        eventIds: cards.map((c) => c.dataset.eventId || ''),
        dates: cards.map((c) => { const t = c.querySelector('.video-time'); return t ? t.innerText.replace(/\s+/g, ' ').trim() : null; }),
        firstCard: cards[0] ? cards[0].innerText.replace(/\s+/g, ' ').trim().slice(0, 40) : null,
        empty: empty ? empty.innerText.replace(/\s+/g, ' ').trim().slice(0, 40) : null,
    });
})()
