(() => {
    const out = {};
    ['.tab-btn', '[class*="tab-btn"]', '.phone-action-bar button', '.bottom-action-bar button', '.action-bar button', '.floating-dock button'].forEach(sel => {
        out[sel] = [...document.querySelectorAll(sel)].map(e => {
            const b = e.getBoundingClientRect();
            return { t: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 12), x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
        });
    });
    out.headerRightChildren = [...document.querySelectorAll('#headerRight > *')].map(e => ({ tag: e.tagName, id: e.id, cls: (e.className || '').toString().slice(0, 30) }));
    out.headerLeft = [...document.querySelectorAll('.main-header-left > *, #headerLeft > *')].map(e => ({ tag: e.tagName, id: e.id, cls: (e.className || '').toString().slice(0, 30) }));
    return JSON.stringify(out, null, 1);
})()
