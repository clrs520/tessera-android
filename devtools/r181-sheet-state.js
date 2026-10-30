JSON.stringify((() => {
    const v = window.viewer;
    const st = (label) => {
        const sb = v.dom.sidebar, fs = v.dom.filterStack, fb = v.dom.filterToggleBtn;
        const r = fs.getBoundingClientRect(), fr = fb.getBoundingClientRect();
        const hit = document.elementFromPoint(fr.left + fr.width / 2, fr.top + fr.height / 2);
        const cs = getComputedStyle(fs);
        return { label, sidebar: sb.className, filtersOpenClass: sb.classList.contains('filters-open'),
            sheet: { w: Math.round(r.width), h: Math.round(r.height), l: Math.round(r.left),
                opacity: cs.opacity, vis: cs.visibility, tf: cs.transform, disp: cs.display },
            funnel: { x: Math.round(fr.left + fr.width / 2), y: Math.round(fr.top + fr.height / 2),
                w: Math.round(fr.width), h: Math.round(fr.height),
                hit: hit ? (hit.id || hit.className || hit.tagName) : null },
            vp: [innerWidth, innerHeight] };
    };
    return st('现在');
})());
