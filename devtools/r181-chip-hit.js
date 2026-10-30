JSON.stringify((() => {
    const v = window.viewer;
    if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    if (v.setFiltersOpen) v.setFiltersOpen(true, false);
    const out = { sidebar: v.dom.sidebar.className, vp: [innerWidth, innerHeight], chips: [], sheet: null };
    const fs = v.dom.filterStack.getBoundingClientRect();
    out.sheet = { w: Math.round(fs.width), h: Math.round(fs.height), l: Math.round(fs.left), t: Math.round(fs.top) };
    for (const sel of ['#sheetStarBtn', '#sheetTriggerBtn', '#sheetSortBtn']) {
        const el = document.querySelector(sel);
        if (!el) { out.chips.push({ sel, missing: true }); continue; }
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        const stack = hit ? document.elementsFromPoint(cx, cy).slice(0, 4)
            .map((n) => `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/)[0] : ''}`) : [];
        out.chips.push({ sel, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width),
            h: Math.round(r.height), text: el.textContent.trim(),
            hitIsSelf: !!hit && (hit === el || el.contains(hit)),
            hit: hit ? (hit.id || hit.className || hit.tagName) : null, stack });
    }
    return out;
})());
