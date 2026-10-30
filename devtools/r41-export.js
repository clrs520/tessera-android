(() => {
    const m = document.querySelector('#phoneExportModal');
    if (!m) return 'no modal';
    const mc = m.querySelector('.modal-content');
    const s = getComputedStyle(mc);
    return JSON.stringify({
        open: getComputedStyle(m).display !== 'none',
        panelBg: s.backgroundColor,
        gutter: mc.offsetWidth - mc.clientWidth,
        vScroll: mc.scrollHeight > mc.clientHeight + 1,
        startBtn: (function () {
            const b = mc.querySelector('#peStartBtn');
            if (!b) return null;
            const r = b.getBoundingClientRect();
            return { bg: getComputedStyle(b).backgroundColor, dev: [Math.round((r.left + r.width / 2) * devicePixelRatio), Math.round((r.top + r.height / 2) * devicePixelRatio)] };
        })()
    });
})()
