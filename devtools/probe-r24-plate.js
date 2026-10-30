(() => {
    // Round 21 item 3: the 详细数据 plate as a resizable box. Reads the plate, the grip, where it
    // sits against the picture, and what the corner drag left in storage.
    const el = document.getElementById('metaDetailOverlay');
    if (!el) return JSON.stringify({ error: 'no plate' });
    const grip = document.getElementById('statsResizeHandle');
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const content = el.querySelector('.stats-content');
    const cr = content ? content.getBoundingClientRect() : null;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;height:var(--safe-top);visibility:hidden';
    document.body.appendChild(probe);
    const safeTop = probe.offsetHeight;
    probe.remove();

    const feeds = [...document.querySelectorAll('#playerArea video')]
        .map(v => v.getBoundingClientRect()).filter(b => b.width > 0);
    let overlap = 0;
    feeds.forEach(a => {
        const w = Math.min(r.right, a.right) - Math.max(r.left, a.left);
        const h = Math.min(r.bottom, a.bottom) - Math.max(r.top, a.top);
        if (w > 0 && h > 0) overlap += w * h;
    });
    const plateArea = Math.max(1, r.width * r.height);

    return JSON.stringify({
        shown: el.classList.contains('show'),
        box: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) },
        cls: el.className,
        inline: { left: el.style.left, top: el.style.top, w: el.style.width, h: el.style.height },
        cols: cs.getPropertyValue('--stats-cols') || '(unset)',
        gridCols: cs.gridTemplateColumns.split(' ').length,
        fontSize: cs.fontSize,
        contentOverflow: content ? getComputedStyle(content).overflowY : '',
        contentScroll: content ? [content.scrollTop, content.scrollHeight, Math.round(cr.height)] : null,
        grip: grip ? (() => {
            const g = grip.getBoundingClientRect();
            return { display: getComputedStyle(grip).display, w: Math.round(g.width), h: Math.round(g.height),
                inside: g.right <= r.right + 1 && g.bottom <= r.bottom + 1 };
        })() : null,
        overlapPct: +(overlap / plateArea * 100).toFixed(1),
        vw: innerWidth, vh: innerHeight, safeTop,
        stored: localStorage.getItem('tdashcam.statsPlate'),
    });
})()
