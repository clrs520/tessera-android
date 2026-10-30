(() => {
    const open = [...document.querySelectorAll('*')].filter(e => {
        const cs = getComputedStyle(e);
        return cs.position === 'fixed' && parseFloat(cs.zIndex || 0) >= 100 && cs.display !== 'none' && e.getBoundingClientRect().height > 400;
    }).map(e => { const r = e.getBoundingClientRect(); return { id: e.id, cls: String(e.className).slice(0, 60), y: Math.round(r.y), h: Math.round(r.height), bg: getComputedStyle(e).backgroundColor }; });
    return JSON.stringify(open);
})()
