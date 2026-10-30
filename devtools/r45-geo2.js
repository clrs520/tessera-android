(() => {
    const ov = document.getElementById('androidDirModal');
    const c = ov.querySelector('.modal-content');
    const hint = document.getElementById('androidDirHint');
    const wide = [];
    ov.querySelectorAll('*').forEach(e => {
        const r = e.getBoundingClientRect();
        if (r.right > innerWidth + 0.5 || r.left < -0.5 || e.scrollWidth > e.clientWidth + 1) {
            wide.push({cls: (e.className || e.tagName).toString().slice(0, 34), id: e.id,
                x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.right), sw: e.scrollWidth, cw: e.clientWidth,
                ws: getComputedStyle(e).whiteSpace, wb: getComputedStyle(e).wordBreak, ovx: getComputedStyle(e).overflowX});
        }
    });
    return JSON.stringify({
        hintShown: getComputedStyle(hint).display !== 'none',
        errText: (document.getElementById('androidDirHintError').textContent || '').slice(0, 60),
        content: {x: Math.round(c.getBoundingClientRect().x), w: Math.round(c.getBoundingClientRect().width),
                  scroll: [c.scrollWidth, c.clientWidth], ovx: getComputedStyle(c).overflowX},
        overlayScroll: [ov.scrollWidth, ov.clientWidth],
        offenders: wide.slice(0, 14)
    }, null, 1);
})()
