// R188 — where the per-frame cost of the window fill actually goes.
(async () => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const el = c.container;
    const events = c.listEvents;
    if (!events || !c.listWindowed()) return JSON.stringify({ err: 'no windowed list' });
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const drain = async (n) => { for (let i = 0; i < n; i++) await frame(); };

    // Quiesce: let any queued window fill finish.
    await drain(30);

    const gaps = async (n, body) => {
        let last = performance.now();
        const out = [];
        for (let i = 0; i < n; i++) {
            if (body) body(i);
            await frame();
            const now = performance.now();
            out.push(Math.round(now - last));
            last = now;
        }
        return out;
    };
    const stat = (a) => ({
        n: a.length,
        avg: Math.round(a.reduce((s, x) => s + x, 0) / a.length),
        max: Math.max(...a),
        over32: a.filter((x) => x > 32).length,
    });

    const idle = await gaps(20);

    // Building cards only (never inserted, so no layout of the scroll area).
    const grab = (from, count) => {
        const t = performance.now();
        const cards = [];
        for (let i = from; i < from + count && i < events.length; i++) {
            const card = c.createVideoCard(events[i]);
            if (card) cards.push(card);
        }
        return { ms: performance.now() - t, cards };
    };
    const buildOnly = [];
    for (let k = 0; k < 6; k++) buildOnly.push(Math.round(grab(600 + k * 12, 12).ms));

    // Build + insert into an off-layout host (a detached div still parses/creates nodes).
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:360px;';
    document.body.appendChild(host);
    const buildInsert = [];
    for (let k = 0; k < 6; k++) {
        const t = performance.now();
        const { cards } = grab(700 + k * 12, 12);
        const frag = document.createDocumentFragment();
        cards.forEach((card) => frag.appendChild(card));
        host.appendChild(frag);
        buildInsert.push(Math.round(performance.now() - t));
    }
    host.remove();

    // The real thing: re-anchor a deep window (clears every row and builds visible+2).
    el.scrollTop = Math.round(400 * (c.windowPitch || 74));
    await drain(20);
    const reanchor = [];
    for (let k = 0; k < 4; k++) {
        const t = performance.now();
        c.placeWindow(400 + k * 40);
        reanchor.push(Math.round(performance.now() - t));
        await drain(6);
    }

    // The real thing, second half: the rAF fill that follows a re-anchor.
    el.scrollTop = Math.round(400 * (c.windowPitch || 74));
    await drain(20);
    c.placeWindow(400);
    const fill = await gaps(24);

    return JSON.stringify({
        rows: c.listRowNodes().length,
        idle: stat(idle),
        buildOnly,
        buildInsert,
        reanchor,
        fill: stat(fill),
        fillGaps: fill,
    });
})()
