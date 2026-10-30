(() => {
    const vis = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };
    return JSON.stringify([...document.querySelectorAll('button,[role=button],.recent-dir-item,.folder-item')]
        .filter(vis).slice(0, 30).map(el => {
            const r = el.getBoundingClientRect();
            return {
                id: el.id,
                cls: (el.className || '').toString().slice(0, 26),
                t: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 18),
                x: Math.round(r.left + r.width / 2),
                y: Math.round(r.top + r.height / 2)
            };
        }));
})()
