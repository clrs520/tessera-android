// R103 · What actually paints the gradient behind the find-page hero?
// Walk every element whose box covers the hero's centre and report its own paint, so the fallback
// backdrop is measured from the real layer instead of a guessed constant.
(function () {
    const hero = document.querySelector('.player-area.empty .empty-hero') || document.querySelector('.empty-hero');
    const bar = document.querySelector('.phone-action-bar');
    const probe = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
        const stack = document.elementsFromPoint(cx, cy).slice(0, 12).map((n) => {
            const s = getComputedStyle(n);
            const cls = (typeof n.className === 'string') ? n.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
            return { n: n.tagName + (n.id ? '#' + n.id : '') + (cls ? '.' + cls : ''), bg: s.backgroundColor,
                img: (s.backgroundImage || '').slice(0, 70), z: s.zIndex, pos: s.position, op: s.opacity,
                filter: (s.filter || '').slice(0, 30) };
        });
        return { rect: [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.top)], stack };
    };
    return JSON.stringify({ hero: probe(hero), bar: probe(bar) }, null, 1);
})()
