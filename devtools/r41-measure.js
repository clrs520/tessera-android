(() => {
    const dpr = devicePixelRatio;
    const out = { vw: innerWidth, vh: innerHeight, dpr, theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light' };
    const bar = document.querySelector('.phone-action-bar');
    out.bar = [];
    if (bar) {
        bar.querySelectorAll('button, .tab-btn, [role="button"]').forEach(b => {
            const r = b.getBoundingClientRect();
            if (r.width < 2) return;
            out.bar.push({
                label: (b.textContent || '').trim().slice(0, 8),
                id: b.id || null,
                cls: String(b.className).slice(0, 30),
                dev: [Math.round((r.left + r.width / 2) * dpr), Math.round((r.top + r.height / 2) * dpr)]
            });
        });
        const br = bar.getBoundingClientRect();
        out.barRect = { top: Math.round(br.top), h: Math.round(br.height) };
    }
    const hero = document.querySelector('.player-area.empty .empty-hero');
    if (hero && hero.offsetWidth) {
        const r = hero.getBoundingClientRect();
        out.hero = { top: Math.round(r.top), bottom: Math.round(r.bottom), dev: [Math.round((r.left + r.width / 2) * dpr), Math.round((r.top + r.height / 2) * dpr)] };
    }
    const cards = document.querySelectorAll('.video-card');
    out.cardCount = cards.length;
    if (cards.length) {
        const first = [...cards].find(c => { const r = c.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight && r.height > 20; });
        if (first) { const r = first.getBoundingClientRect(); out.firstVisibleCard = { top: Math.round(r.top), dev: [Math.round((r.left + r.width / 2) * dpr), Math.round((r.top + r.height / 2) * dpr)] }; }
    }
    out.playing = !!(document.querySelector('#mainVideo') && !document.querySelector('#mainVideo').paused);
    return JSON.stringify(out, null, 1);
})()
