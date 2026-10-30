(() => {
    const q = (id, m) => { const el = document.querySelector('#' + id + ' [data-mode=' + m + ']'); if (!el) return null; const r = el.getBoundingClientRect(); return { id, m, x: Math.round((r.x + r.width / 2) * devicePixelRatio), y: Math.round((r.y + r.height / 2) * devicePixelRatio) }; };
    return JSON.stringify([q('themeChoice', 'dark'), q('themeChoice', 'light'), q('tapBehaviorChoice', 'start')].filter(Boolean));
})()
