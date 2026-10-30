(() => {
    const el = document.querySelector('#tapBehaviorChoice [data-mode=resume]');
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const sheet = el.closest('.menu-sheet, #menuSheet, aside, .sheet');
    const anc = [];
    let p = el;
    while (p && p !== document.body) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden') anc.push(p.id || p.className); p = p.parentElement; }
    return JSON.stringify({
        css: { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height },
        dpr: window.devicePixelRatio,
        sheetClass: sheet ? sheet.className : null,
        hiddenAncestors: anc,
        bodyOverflow: getComputedStyle(document.body).overflow,
    });
})()
