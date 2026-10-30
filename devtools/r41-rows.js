(() => {
    const dpr = devicePixelRatio;
    const rows = [];
    document.querySelectorAll('#headerRight [data-context], #headerRight .menu-row, #headerRight button').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 2) return;
        rows.push({
            txt: (el.textContent || '').trim().slice(0, 14),
            act: el.dataset ? (el.dataset.action || el.dataset.context || '') : '',
            dev: [Math.round((r.left + r.width / 2) * dpr), Math.round((r.top + r.height / 2) * dpr)]
        });
    });
    return JSON.stringify({ theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light', rows }, null, 1);
})()
