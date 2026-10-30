JSON.stringify((() => {
    const v = window.viewer, list = v.dom.fileList, l = v.videoListComponent;
    const box = list.getBoundingClientRect();
    const rows = [...list.querySelectorAll('.video-card')];
    const under = rows.find((r) => r.getBoundingClientRect().bottom > box.top + 4);
    const blank = [...list.querySelectorAll('.list-spacer')].reduce((s, n) => {
        const r = n.getBoundingClientRect();
        return s + Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top));
    }, 0);
    return { left: Math.round(box.left), sy: Math.round(list.scrollTop), rows: rows.length,
        win: [l.listTop, l.listEnd], blankPx: Math.round(blank),
        underIndex: under ? under.dataset.listIndex : null,
        underText: under ? under.textContent.replace(/\s+/g, ' ').slice(0, 70) : null,
        nextText: under ? rows[rows.indexOf(under) + 1].textContent.replace(/\s+/g, ' ').slice(0, 70) : null };
})());
