(() => {
    const d = devicePixelRatio;
    const out = [];
    document.querySelectorAll('input, textarea, button, [role="button"]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none') return;
        out.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            cls: (el.className || '').toString().slice(0, 34),
            txt: (el.value || el.textContent || '').trim().slice(0, 14),
            tap: [Math.round((r.left + r.width / 2) * d), Math.round((r.top + r.height / 2) * d)]
        });
    });
    return JSON.stringify(out);
})()
