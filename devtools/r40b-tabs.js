(() => {
    const out = {};
    for (const id of ['tabListBtn', 'tabFolderBtn', 'tabPiPBtn', 'tabRefreshBtn', 'tabMoreBtn']) {
        const b = document.getElementById(id);
        if (!b) { out[id] = null; continue; }
        const r = b.getBoundingClientRect();
        out[id] = {
            txt: (b.textContent || '').trim().slice(0, 6),
            x: Math.round((r.left + r.width / 2) * devicePixelRatio),
            y: Math.round((r.top + r.height / 2) * devicePixelRatio),
        };
    }
    out.drawerOpen = document.getElementById('drawer')?.classList.contains('open');
    return out;
})()
