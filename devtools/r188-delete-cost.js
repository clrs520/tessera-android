// R188 #2 — attribute the long frame that follows a delete from deep in the list.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const drain = async (n) => { for (let i = 0; i < n; i++) await frame(); };

    el.scrollTop = Math.round(500 * (c.windowPitch || 74));
    await drain(40);

    const log = [];
    const t0 = performance.now();
    const at = () => Math.round(performance.now() - t0);

    if (!c.__r188CardTimer) {
        c.__r188CardTimer = { total: 0, calls: 0, peak: 0 };
        const orig = c.createVideoCard.bind(c);
        let batchStart = 0;
        c.createVideoCard = (ev) => {
            const t = performance.now();
            const r = orig(ev);
            c.__r188CardTimer.total += performance.now() - t;
            c.__r188CardTimer.calls += 1;
            return r;
        };
    }
    c.__r188CardTimer.total = 0; c.__r188CardTimer.calls = 0;

    // Count thumbnail requests and time them.
    if (!window.__r188Thumb) {
        window.__r188Thumb = { n: 0, ms: 0 };
        const get = FrameFetcher.get.bind(FrameFetcher);
        FrameFetcher.get = (...a) => {
            const t = performance.now();
            const r = get(...a);
            window.__r188Thumb.ms += performance.now() - t;
            window.__r188Thumb.n += 1;
            return r;
        };
    }
    window.__r188Thumb.n = 0; window.__r188Thumb.ms = 0;

    const longTasks = [];
    let obs = null;
    try {
        obs = new PerformanceObserver((list) => {
            list.getEntries().forEach((e) => longTasks.push([at(), Math.round(e.duration), e.name, e.attribution?.[0]?.name || '']));
        });
        obs.observe({ entryTypes: ['longtask'] });
    } catch (e) { /* unsupported */ }

    let last = performance.now();
    const frameGaps = [];
    let stop = false;
    (function loop() {
        if (stop) return;
        const now = performance.now();
        frameGaps.push([at(), Math.round(now - last)]);
        last = now;
        requestAnimationFrame(loop);
    })();

    const target = c.listEvents[Math.round(el.scrollTop / (c.windowPitch || 74)) + 2];
    v.openDeleteConfirm(target);
    const tConfirm = performance.now();
    await v.confirmDeleteEvent();
    log.push(['confirm', at(), Math.round(performance.now() - tConfirm)]);
    await drain(60);
    stop = true;
    if (obs) obs.disconnect();

    return JSON.stringify({
        target: target?.eventId,
        cards: c.__r188CardTimer.calls,
        cardMs: Math.round(c.__r188CardTimer.total),
        thumbs: window.__r188Thumb.n,
        thumbMs: Math.round(window.__r188Thumb.ms),
        longTasks: longTasks.slice(0, 12),
        worstFrames: frameGaps.sort((a, b) => b[1] - a[1]).slice(0, 8),
        log,
    });
})()
