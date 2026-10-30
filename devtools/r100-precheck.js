// R100-2 pre-check: inject the trim reserve the way the new build will apply it (`--hud-h` is what
// `startControlsReserve()` will publish from the card's own box) and re-measure the picture/card
// overlap in the three portrait views. If single/legacy do not come out at 0 and six-up does not stay
// at 0, the rule is wrong before it costs a build.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const root = document.documentElement;
    const r = n => { const b = n.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: b.height }; };
    const painted = (video, cell) => {
        if (!video || !video.videoWidth) return null;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const h = video.videoHeight * s;
        return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2, h };
    };
    const overlapWith = box => [...document.querySelectorAll('.video-container')]
        .filter(c => getComputedStyle(c).display !== 'none' && !c.classList.contains('hidden'))
        .map(c => {
            const p = painted(c.querySelector('video'), c);
            if (!p) return null;
            const o = Math.min(box.bottom, p.bottom) - Math.max(box.top, p.top);
            return { cam: c.dataset.camera || '?', over: +Math.max(0, o).toFixed(1), picH: +p.h.toFixed(1) };
        })
        .filter(Boolean);
    const setRule = on => {
        const existing = document.getElementById('r100-probe');
        if (existing) existing.remove();
        if (!on) return;
        const s = document.createElement('style');
        s.id = 'r100-probe';
        s.textContent = `
            body.clip-trimming .metadata-panel { bottom: calc(var(--meta-bottom) + 6px) !important; }
            body.clip-trimming .player-area.single-view .video-container.is-active-single {
                bottom: calc(var(--hud-h, 60px) + 8px) !important; height: auto !important; }
            body.clip-trimming .player-area.legacy-view {
                padding-bottom: calc(var(--controls-h, 120px) + 8px + var(--hud-h, 60px) + 8px) !important; }`;
        document.head.appendChild(s);
        root.style.setProperty('--hud-h', '60px');
    };
    const measure = async label => {
        await sleep(700);
        const card = r(document.querySelector('.metadata-panel'));
        const strip = document.querySelector('.clip-filmstrip');
        return { label, cardTop: +card.top.toFixed(1), cardBottom: +card.bottom.toFixed(1),
            overStrip: strip ? +Math.max(0, card.bottom - strip.getBoundingClientRect().top).toFixed(1) : null,
            cells: overlapWith(card) };
    };
    const setView = n => document.querySelector(`.view-btn[data-view="${n}"]`)?.click();
    const out = { viewport: `${innerWidth}x${innerHeight}`, shots: [] };
    const ev = (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
    await sleep(2500);
    if (!v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(900); }
    for (const view of ['front', 'legacy', 'grid', 'grid4']) {
        setView(view);
        await sleep(900);
        setRule(false);
        out.shots.push(await measure(`${view} before`));
        setRule(true);
        out.shots.push(await measure(`${view} after `));
    }
    setRule(false);
    root.style.removeProperty('--hud-h');
    return out;
})()
