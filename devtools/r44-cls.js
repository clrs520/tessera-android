(() => {
    const el = document.querySelector('.header-collapsed');
    return JSON.stringify({
        bodyCls: document.body.className,
        headerCollapsedOn: el ? (el.className || el.tagName) : 'none',
        panelRect: (() => { const p = document.querySelector('.header-actions-group'); if (!p) return null; const r = p.getBoundingClientRect(); return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]; })()
    });
})()
