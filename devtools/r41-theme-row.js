(() => {
    const row = [...document.querySelectorAll('#headerRight button')]
        .find(e => /切换主题|Toggle theme/.test(e.textContent) && e.offsetWidth);
    if (!row) return 'none';
    const r = row.getBoundingClientRect();
    return Math.round((r.left + r.width / 2) * devicePixelRatio) + ',' + Math.round((r.top + r.height / 2) * devicePixelRatio);
})()
