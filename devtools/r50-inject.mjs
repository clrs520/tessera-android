(() => {
    const css = `
html.touch-ui .sidebar.nav-search .quick-filters{padding-bottom:0}
html.touch-ui .sidebar.nav-search .event-search-row{margin-bottom:calc(-1 * var(--field-h))}
html.touch-ui .sidebar.nav-search .date-chips{display:none}
`;
    let s = document.getElementById('r50-preview');
    if (!s) {
        s = document.createElement('style');
        s.id = 'r50-preview';
        document.head.appendChild(s);
    }
    s.textContent = css;
    const sb = document.querySelector('.sidebar');
    const row = document.querySelector('.event-search-row');
    const cancel = document.getElementById('searchCancelBtn');
    const list = document.getElementById('fileList');
    const rr = row.getBoundingClientRect();
    const cr = cancel.getBoundingClientRect();
    return JSON.stringify({
        html: document.documentElement.className,
        vp: window.innerWidth + 'x' + window.innerHeight,
        navSearch: sb.classList.contains('nav-search'),
        tap: [((rr.left + rr.right) / 2) | 0, ((rr.top + rr.bottom) / 2) | 0],
        cancel: [((cr.left + cr.right) / 2) | 0, ((cr.top + cr.bottom) / 2) | 0],
        listTop: list.getBoundingClientRect().top | 0,
    });
})()
