(() => {
    if (window.viewer && window.viewer.setLanguage) window.viewer.setLanguage('en');
    const p = document.querySelector('.header-collapsed .header-actions-group');
    const items = [...p.querySelectorAll('.btn-text')].map(t => ({
        s: t.textContent.trim(), w: Math.round(t.scrollWidth)
    })).sort((a, b) => b.w - a.w).slice(0, 4);
    const segs = [...p.querySelectorAll('.choice-segment')].map(t => ({s: t.textContent.trim(), w: Math.round(t.scrollWidth)})).sort((a,b)=>b.w-a.w).slice(0,3);
    return JSON.stringify({lang: localStorage.getItem('language'), longestRows: items, longestSegs: segs, grid: getComputedStyle(p).gridTemplateColumns});
})()
