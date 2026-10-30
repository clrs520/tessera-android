// R101-3 precheck: inject the *proposed* rule (the yield without the `clip-trimming` gate) into the
// running 1.2.167, which only has the trim-gated one, and measure both states in all four views.
// This is the cheapest possible answer to "does widening the rule clear 9.6/16.3 px without
// touching six-up or four-up" — before a build that takes ten minutes.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const root = document.documentElement;
    const r = n => { const b = n && n.getBoundingClientRect ? n.getBoundingClientRect() : null;
        return b ? { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1),
            left: +b.left.toFixed(1), right: +b.right.toFixed(1) } : null; };
    const painted = (video, cell) => {
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const h = video.videoHeight * s, w = video.videoWidth * s;
        return { top: +(b.top + (b.height - h) / 2).toFixed(1), bottom: +(b.top + (b.height + h) / 2).toFixed(1),
            // left/right are what the overlap test needs; a rect without them made every width
            // compare NaN, and NaN > 0 is false, so the judge reported "no overlap" everywhere.
            left: +(b.left + (b.width - w) / 2).toFixed(1), right: +(b.left + (b.width + w) / 2).toFixed(1),
            h: +h.toFixed(1), w: +w.toFixed(1) };
    };
    const card = () => (document.getElementById('metadataPanel') || document.querySelector('.metadata-panel'));
    const shot = (label) => {
        const c = r(card());
        const cells = [...document.querySelectorAll('.video-container')]
            .filter(x => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'));
        const over = cells.map(x => {
            const p = painted(x.querySelector('video'), x);
            if (!p || !c) return null;
            const v = Math.min(c.bottom, p.bottom) - Math.max(c.top, p.top);
            const w = Math.min(c.right, p.right) - Math.max(c.left, p.left);
            return v > 0 && w > 0 ? `${x.dataset.camera || '?'}:覆盖${v.toFixed(1)}` : null;
        }).filter(Boolean);
        return { label, view: document.querySelector('.player-area').className.replace('player-area ', ''),
            card: c, hudH: getComputedStyle(root).getPropertyValue('--hud-h').trim(),
            // A card with no telemetry has no plate to overlap anything with; reporting 无 for it
            // would be a vacuous pass, so say which state was actually measured.
            cardLive: !!card().classList.contains('has-data'),
            frames: cells.map(x => { const p = painted(x.querySelector('video'), x);
                return p ? `${(x.dataset.camera || '?')}:${p.h.toFixed(0)}@${p.top.toFixed(0)}` : null; }).filter(Boolean),
            over };
    };
    const setView = name => document.querySelector(`.view-btn[data-view="${name}"]`)?.click();
    const VIEWS = ['front', 'legacy', 'grid', 'grid4'];
    const sweep = async () => {
        const out = [];
        for (const name of VIEWS) { setView(name); await sleep(900); out.push(shot(name)); }
        return out;
    };

    const ev = (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
    await sleep(3000);
    if (v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(900); }

    const before = { nonTrim: await sweep() };
    if (!v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(900); }
    before.trim = await sweep();

    // The proposal: same two levers, no `clip-trimming` gate, `body` prefix so 3346/6573 cannot win
    // on document order.
    const s = document.createElement('style');
    s.id = 'r101-proposal';
    s.textContent = `@media (hover: none) and (pointer: coarse) and (orientation: portrait) {
        body .player-area.single-view .video-container.is-active-single {
            bottom: calc(var(--hud-h, 60px) + 8px) !important; height: auto !important; }
        body .player-area.legacy-view {
            padding-bottom: calc(var(--controls-h, 120px) + 8px + var(--hud-h, 60px) + 8px); }
    }`;
    document.head.appendChild(s);
    await sleep(1200);
    const after = { trim: await sweep() };
    if (v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(1000); }
    after.nonTrim = await sweep();
    s.remove();

    const fmt = (t, g) => g.map(x => `${x.label}[${x.view.split(' ')[0]}] hud=${x.hudH} live=${x.cardLive} card=${x.card ? `${x.card.top}..${x.card.bottom}` : 'null'} over=${x.over.join(',') || '无'} frames=${x.frames.join(' ')}`).join('\n   ');
    return { orient: `${innerWidth}x${innerHeight}`,
        before_current_build: `\n   ${fmt('非剪辑', before.nonTrim)}\n   --- 剪辑\n   ${fmt('', before.trim)}`,
        after_proposal: `\n   剪辑:\n   ${fmt('', after.trim)}\n   非剪辑:\n   ${fmt('', after.nonTrim)}` };
})()
