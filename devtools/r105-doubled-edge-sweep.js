// R105 · Sweep the WHOLE page for a doubled edge, not just the lens surfaces.
// The top line reads thick because a 1px border and a sharp (`blur <= 1px`) inset highlight sit side
// by side. Same defect class as R103's bottom line, which my own guard only checked downward — so
// this walks every visible element and reports any edge carrying two light bands.
(function () {
    const parseShadow = (sh) => (sh || '').split(/,(?![^(]*\))/).map((p) => {
        const nums = (p.match(/-?[\d.]+px/g) || []).map(parseFloat);
        const col = (p.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
        const m = col.match(/[\d.]+/g) || [];
        const a = m.length > 3 ? +m[3] : (m.length === 3 ? 1 : 0);
        return { inset: /inset/.test(p), x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0,
            light: m.length >= 3 ? a * (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255 : 0 };
    });
    const lumOf = (c) => { const m = (c || '').match(/[\d.]+/g) || []; if (m.length < 3) return 0;
        const a = m.length > 3 ? +m[3] : 1; return a * (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255; };
    const label = (el) => {
        const cls = (typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
        return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
    };
    const hits = [];
    for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 16) continue;
        const shadows = parseShadow(cs.boxShadow);
        if (!shadows.some((s) => s.inset)) continue;
        const perEdge = {};
        for (const [k, side] of Object.entries({ Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' })) {
            const bw = parseFloat(cs['border' + k + 'Width']) || 0;
            const bLight = bw > 0 && cs['border' + k + 'Style'] !== 'none' ? lumOf(cs['border' + k + 'Color']) : 0;
            const onEdge = shadows.filter((s) => s.inset && s.blur <= 1.5 && (
                (side === 'top' && s.y > 0) || (side === 'bottom' && s.y < 0)
                || (side === 'left' && s.x > 0) || (side === 'right' && s.x < 0)));
            const n = (bLight > 0.05 ? 1 : 0) + onEdge.filter((s) => s.light > 0.05).length;
            if (n >= 2) perEdge[k] = { lines: n, borderPx: +bw.toFixed(2), borderLum: +bLight.toFixed(3),
                sharpInsets: onEdge.length };
        }
        if (Object.keys(perEdge).length) hits.push({ el: label(el), size: `${Math.round(r.width)}x${Math.round(r.height)}`, perEdge });
    }
    const byEdge = {};
    hits.forEach((h) => Object.keys(h.perEdge).forEach((k) => byEdge[k] = (byEdge[k] || 0) + 1));
    return JSON.stringify({ total: hits.length, byEdge, hits: hits.slice(0, 40) }, null, 1);
})()
