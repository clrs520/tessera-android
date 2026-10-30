(() => {
    const Q = (s) => document.querySelector(s);
    const geo = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
            w: Math.round(r.width),
            h: Math.round(r.height),
            t: Math.round(r.top),
            b: Math.round(r.bottom),
            l: Math.round(r.left),
            rgt: Math.round(r.right),
            vis: cs.visibility,
            disp: cs.display,
            op: cs.opacity,
        };
    };
    const over = (a, b) => {
        if (!a || !b) return null;
        const x = Math.min(a.rgt, b.rgt) - Math.max(a.l, b.l);
        const y = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        return x > 1 && y > 1 ? Math.round(x * y) : 0;
    };

    const sb = Q('.sidebar');
    const search = Q('#eventSearch');
    const df = Q('#dateFilter');
    const ef = Q('#eventFilter');
    const qf = Q('.quick-filters');
    const fsb = Q('#fullscreenBtn');
    const strip = Q('.clip-filmstrip') || Q('#clipFilmstrip');
    const meta = Q('.metadata-panel');
    const stats = Q('.stats-overlay');

    const out = {
        orient: matchMedia('(orientation: landscape)').matches ? 'land' : 'port',
        vp: [innerWidth, innerHeight],
        dpr: devicePixelRatio,
        playing: !!Q('.video-card.playing'),
        cardCount: document.querySelectorAll('.video-card').length,
        drawer: {
            sidebar: Math.round(sb?.getBoundingClientRect().width || 0),
            fieldH: sb ? getComputedStyle(sb).getPropertyValue('--field-h').trim() : '',
            quickFilters: geo(qf),
            search: geo(search),
            dateFilter: geo(df),
            eventFilter: geo(ef),
            widths: [search?.getBoundingClientRect().width, df?.getBoundingClientRect().width,
                ef?.getBoundingClientRect().width].map((v) => (v == null ? null : Math.round(v))),
        },
        item9: { fsBtn: geo(fsb) },
        item3: {
            filmstrip: geo(strip),
            metadata: geo(meta),
            stats: geo(stats),
            overMeta: over(strip, meta),
            overStats: over(strip, stats),
            stripRatio: strip ? +(strip.getBoundingClientRect().width / strip.getBoundingClientRect().height).toFixed(3) : null,
        },
    };

    const sheet = Q('#phoneExportModal');
    if (sheet && sheet.classList.contains('show')) {
        const video = Q('#mainPlayer') || Q('video');
        const tiles = [...document.querySelectorAll('.pe-tile')].map((t) => {
            const r = t.getBoundingClientRect();
            return { n: t.dataset.index, w: Math.round(r.width), h: Math.round(r.height), ratio: +(r.width / r.height).toFixed(3) };
        });
        const plate = Q('.pe-plate') || Q('.pe-stage');
        out.item6 = {
            tiles,
            plate: geo(plate),
            videoRatio: video ? +(video.videoWidth / video.videoHeight).toFixed(3) : null,
            rects: window.tdViewer?.peRects ?? null,
        };
    }
    return JSON.stringify(out, null, 1);
})()
