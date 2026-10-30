(() => {
    const p = document.querySelector('.header-collapsed .header-actions-group');
    const items = [...p.querySelectorAll('.btn-text')].map(t => ({
        s: t.textContent.trim(), w: Math.round(t.scrollWidth), cell: Math.round(t.parentElement.getBoundingClientRect().width)
    })).sort((a, b) => b.w - a.w).slice(0, 4);
    const segs = [...p.querySelectorAll('.choice-segment')].map(t => ({s: t.textContent.trim(), w: Math.round(t.scrollWidth)})).sort((a,b)=>b.w-a.w).slice(0,3);
    return JSON.stringify({lang: localStorage.getItem('language'), grid: [getComputedStyle(p).gridTemplateColumns, Math.round(p.getBoundingClientRect().width)], longestRows: items, longestSegs: segs});
})()
