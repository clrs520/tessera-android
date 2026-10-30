(() => {
    // Off-dialect colours: the two Bootstrap/iOS blues, the desktop CTA gradient stops, and the
    // folder-browser violet family. Anything else on screen is either a neutral or the phone accent.
    const OFF = {
        'rgb(0, 123, 255)': '#007bff',
        'rgb(0, 122, 255)': '#007aff',
        'rgb(102, 126, 234)': '#667eea',
        'rgb(118, 75, 162)': '#764ba2',
        'rgb(139, 92, 246)': '#8b5cf6',
        'rgb(167, 139, 250)': '#a78bfa',
        'rgb(168, 85, 247)': '#a855f7',
        'rgb(66, 133, 244)': '#4285F4',
        'rgba(0, 123, 255, 0.3)': 'rgba #007bff/.3',
        'rgba(0, 122, 255, 0.3)': 'rgba #007aff/.3'
    };
    const hits = [];
    const seen = new Set();
    document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return;
        for (const p of ['background-color', 'color', 'border-top-color', 'border-left-color', 'fill']) {
            const v = s.getPropertyValue(p);
            if (!OFF[v]) continue;
            const id = (el.tagName + '.' + (el.className || '').toString().slice(0, 40) + '#' + el.id + '|' + p + '|' + OFF[v]);
            if (seen.has(id)) continue;
            seen.add(id);
            hits.push({ el: id.slice(0, 66), prop: p, was: OFF[v], y: Math.round(r.top) });
        }
    });
    return JSON.stringify({ page: document.querySelector('.phone-action-bar') ? 'touch' : '?', n: hits.length, hits });
})()
