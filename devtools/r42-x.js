(() => {
    const cands = [...document.querySelectorAll('button,[role=button]')].filter(b => {
        const t = (b.getAttribute('aria-label') || b.textContent || '').trim();
        return /关闭|收起|×|✕|close/i.test(t);
    }).map(b => { const r = b.getBoundingClientRect(); return { t: (b.getAttribute('aria-label')||b.textContent).trim().slice(0,10), id: b.id, x: Math.round((r.x+r.width/2)*devicePixelRatio), y: Math.round((r.y+r.height/2)*devicePixelRatio), vis: r.width > 0 && getComputedStyle(b).display !== 'none' }; });
    return JSON.stringify(cands);
})()
