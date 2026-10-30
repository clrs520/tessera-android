(() => {
    const out = [];
    document.querySelectorAll('.modal-content, .file-list, .metadata-content, .dir-browser-list').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        out.push({
            cls: String(el.className).slice(0, 40),
            // offsetWidth - clientWidth == horizontal borders + classic scrollbar width.
            // 8px chrome bars show up as border+8; overlay/hidden bars leave just the border.
            chrome: el.offsetWidth - el.clientWidth,
            border: getComputedStyle(el).borderLeftWidth,
            vScroll: el.scrollHeight > el.clientHeight + 1,
            overflowY: getComputedStyle(el).overflowY
        });
    });
    return JSON.stringify({ theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light', sheets: out }, null, 1);
})()
