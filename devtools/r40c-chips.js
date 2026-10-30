(() => {
    return {
        modalOpen: document.getElementById('androidDirModal')?.classList?.contains('show'),
        chips: [...document.querySelectorAll('.dir-volume-chip')].map(c => {
            const r = c.getBoundingClientRect();
            return {
                p: c.dataset.path, off: c.disabled, cls: c.className,
                txt: c.textContent.trim().slice(0, 30),
                tapX: Math.round((r.left + r.width / 2) * devicePixelRatio),
                tapY: Math.round((r.top + r.height / 2) * devicePixelRatio),
            };
        }),
        recents: [...document.querySelectorAll('#recentDirs [data-path]')].map(c => c.dataset.path),
    };
})()
