(() => {
    const hdr = document.querySelector('.header-right');
    const p = document.querySelector('.header-collapsed .header-actions-group') || document.querySelector('.header-actions-group');
    const pr = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    const rows = [...p.querySelectorAll(':scope > button, :scope > a, :scope > .menu-choice')];
    const textX = (() => { const b = rows.find(r => r.tagName === 'BUTTON' && !r.className.includes('menu-choice')); if (!b) return null; const t = b.querySelector('.btn-text'); const r = t.getBoundingClientRect(); return Math.round(r.x); })();
    const out = {
        orient: screen.orientation.type, view: innerWidth + 'x' + innerHeight,
        panel: [Math.round(pr.x), Math.round(pr.y), Math.round(pr.width), Math.round(pr.height)],
        disp: cs.display, cols: cs.gridTemplateColumns, scroll: [p.scrollHeight, p.clientHeight], fits: p.scrollHeight <= p.clientHeight + 1,
        textColumn: textX,
        rows: rows.map(r => { const bb = r.getBoundingClientRect(); const ic = r.querySelector('.btn-icon svg'); const lab = r.querySelector('.btn-text, .choice-label'); const lr = lab ? lab.getBoundingClientRect() : null; return {
            id: r.id || (lab ? lab.textContent.trim() : ''), x: Math.round(bb.x), y: Math.round(bb.y), w: Math.round(bb.width), h: Math.round(bb.height),
            icon: ic ? Math.round(ic.getBoundingClientRect().width) + 'px' : 'NONE',
            labelX: lr ? Math.round(lr.x) : null,
            clip: lab ? (lab.scrollWidth - Math.floor(lab.getBoundingClientRect().width)) : null,
            segs: [...r.querySelectorAll('.choice-segment')].map(s => Math.round(s.getBoundingClientRect().width)),
            on: (() => { const a = r.querySelector('.choice-segment.on'); if (!a) return null; const c = getComputedStyle(a); return a.textContent.trim() + ' ' + c.backgroundColor + '/' + c.color + '/fw' + c.fontWeight; })()
        }; })
    };
    return JSON.stringify(out, null, 1);
})()
