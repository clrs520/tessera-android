JSON.stringify((() => {
    const v = window.viewer;
    const more = document.querySelector('.source-more, #sourceMoreBtn, [data-role="source-more"]');
    const cand = [...document.querySelectorAll('#filterStack button, .filter-sheet-body button')]
        .filter((b) => /更多来源|收起|More sources|Fewer/i.test(b.textContent));
    const info = (b) => { const r = b.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { text: b.textContent.trim().slice(0, 20), cls: b.className,
            rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
            hitIsSelf: !!hit && (hit === b || b.contains(hit)), hit: hit ? (hit.id || hit.className || hit.tagName) : null,
            hidden: b.hidden || getComputedStyle(b).display === 'none',
            aria: b.getAttribute('aria-pressed') }; };
    const before = { expanded: v.sourceExpanded ?? v.state?.sourceExpanded,
        rows: [...document.querySelectorAll('.source-row, .recent-chip')].length,
        visible: [...document.querySelectorAll('.source-row')].filter((n) => n.getBoundingClientRect().height > 0).length };
    const clicked = cand.length ? (cand[0].click(), cand[0].textContent.trim()) : (more && (more.click(), more.textContent.trim()));
    const after = { rows: [...document.querySelectorAll('.source-row, .recent-chip')].length,
        visible: [...document.querySelectorAll('.source-row')].filter((n) => n.getBoundingClientRect().height > 0).length,
        expanded: v.sourceExpanded ?? v.state?.sourceExpanded };
    return { moreFound: !!more, candidates: cand.map(info), clicked, before, after,
        filtersOpen: v.dom.sidebar.classList.contains('filters-open') };
})());
