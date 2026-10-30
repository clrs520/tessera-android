(() => {
    const out = {};
    const more = document.getElementById('phoneMoreModal') || document.getElementById('moreModal');
    out.moreId = more ? more.id : null;
    out.moreDisp = more ? getComputedStyle(more).display : null;
    const about = document.getElementById('aboutBtn');
    const r = about.getBoundingClientRect();
    out.about = {
        txt: (about.textContent || '').trim().slice(0, 12),
        w: Math.round(r.width), h: Math.round(r.height),
        x: Math.round((r.left + r.width / 2) * devicePixelRatio),
        y: Math.round((r.top + r.height / 2) * devicePixelRatio),
    };
    return out;
})()
