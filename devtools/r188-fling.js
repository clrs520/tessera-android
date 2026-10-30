// R188 #5 — what the viewport shows frame by frame while the thumb runs down a 900-event list.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    if (!c.listWindowed()) return JSON.stringify({ err: 'not windowed', n: c.listEvents?.length });

    // Count re-anchors without replacing the method: wrap once, keep the wrapper for the session.
    if (!c.__r188Place) {
        const orig = c.placeWindow.bind(c);
        c.__r188Place = { n: 0 };
        c.placeWindow = (start) => { c.__r188Place.n += 1; return orig(start); };
    }
    c.__r188Place.n = 0;

    const pitch = c.windowPitch || 74;
    const box = () => el.getBoundingClientRect();
    const visibleRows = () => {
        const b = box();
        let seen = 0;
        for (const row of el.querySelectorAll('.video-card')) {
            const r = row.getBoundingClientRect();
            if (r.bottom > b.top + 1 && r.top < b.bottom - 1) seen += 1;
        }
        return seen;
    };
    const frame = () => new Promise((r) => requestAnimationFrame(r));

    const log = { frames: 0, blank: 0, stair: [], maxGap: 0, gaps: [], samples: [] };
    let last = performance.now();

    const sample = (tag) => {
        const now = performance.now();
        const gap = now - last;
        last = now;
        log.frames += 1;
        if (gap > log.maxGap) log.maxGap = Math.round(gap);
        if (gap > 32) log.gaps.push([tag, el.scrollTop | 0, Math.round(gap)]);
        const vis = visibleRows();
        if (tag === 'run' && vis === 0) log.blank += 1;
        if (tag === 'run' && log.samples.length < 400) {
            log.samples.push([el.scrollTop | 0, vis, c.rowsInWindow()]);
        }
        return vis;
    };

    // 1) jump deep: 500 events down in one go
    el.scrollTop = Math.round(500 * pitch);
    await frame();
    sample('jump');
    for (let i = 0; i < 30; i++) { await frame(); sample('settle'); }

    const afterJump = {
        scrollTop: el.scrollTop, top: c.listTop, end: c.listEnd,
        rows: c.listRowNodes().length, vis: visibleRows(),
    };

    // 2) fling: 150 px per frame for 90 frames (~2 events/frame), the way a hard flick reads
    const flingStart = performance.now();
    for (let i = 0; i < 90; i++) {
        el.scrollTop += 150;
        await frame();
        sample('run');
    }
    const flingMs = Math.round(performance.now() - flingStart);

    // 3) one long jump to the end, then settle
    el.scrollTop = el.scrollHeight;
    for (let i = 0; i < 40; i++) { await frame(); sample(i < 3 ? 'run' : 'settle'); }

    return JSON.stringify({
        pitch: Math.round(pitch * 10) / 10,
        placeWindows: c.__r188Place.n,
        afterJump,
        end: {
            scrollTop: el.scrollTop, top: c.listTop, end: c.listEnd,
            rows: c.listRowNodes().length, vis: visibleRows(),
        },
        flingMs,
        frames: log.frames,
        blank: log.blank,
        maxGap: log.maxGap,
        slowGaps: log.gaps.slice(0, 24),
        samples: log.samples,
    });
})()
