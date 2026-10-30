// R100-2 measurement: the user says the driving-data pill covers the picture while trimming, in 单路
// and 大小窗. There is already a clip-state lift (`body.clip-trimming .metadata-panel`, styles.css:1535),
// so the question is not "is it lifted" but "what does it still land on". Report the three boxes and
// their intersection for both views, plus every reserve the pill's dock is computed from.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const r = n => { const b = n && n.getBoundingClientRect ? n.getBoundingClientRect() : null;
        return b ? { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), left: +b.left.toFixed(1),
            right: +b.right.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) } : null; };
    const root = getComputedStyle(document.documentElement);
    const varc = k => root.getPropertyValue(k).trim();
    const pill = document.querySelector('.metadata-panel');
    // The picture is not the cell: a 16:9 frame inside a taller cell leaves letterbox the pill may or
    // may not be sitting on. Compute the painted rect the same way the trigger outline does.
    const paintedRect = (video, cell) => {
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        const b = cell.getBoundingClientRect();
        const scale = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const w = video.videoWidth * scale, h = video.videoHeight * scale;
        return { top: +(b.top + (b.height - h) / 2).toFixed(1), bottom: +(b.top + (b.height + h) / 2).toFixed(1),
            left: +(b.left + (b.width - w) / 2).toFixed(1), right: +(b.left + (b.width + w) / 2).toFixed(1),
            w: +w.toFixed(1), h: +h.toFixed(1) };
    };
    const overlap = (a, b) => {
        if (!a || !b) return null;
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        return w > 0 && h > 0 ? Math.round(w * h) : 0;
    };
    const shot = label => {
        const pa = document.querySelector('.player-area');
        const cells = [...document.querySelectorAll('.video-container')]
            .filter(c => getComputedStyle(c).display !== 'none' && !c.classList.contains('hidden'));
        const pr = r(pill);
        const per = cells.map(c => {
            const painted = paintedRect(c.querySelector('video'), c);
            return { cam: c.dataset.camera || c.className.split(' ').slice(-1)[0],
                cell: r(c), painted, pillOverPainted: overlap(pr, painted),
                pillOverCell: overlap(pr, r(c)) };
        });
        return { label, view: pa.className.replace('player-area ', ''),
            playerArea: r(pa), pill: pr,
            pillH: pr ? pr.h : null,
            filmstrip: r(document.querySelector('.clip-filmstrip')),
            timeline: r(document.querySelector('.timeline-container') || document.querySelector('.progress-container')),
            reserves: { metaBottom: varc('--meta-bottom'), controlsH: varc('--controls-h'),
                actionH: varc('--action-h'), filmstripH: varc('--filmstrip-h') },
            body: [...document.body.classList].filter(c => /clip|context|sidebar|more/.test(c)).join(','),
            pillBottomCss: pill ? getComputedStyle(pill).bottom : null,
            cells: per };
    };

    const out = { viewport: `${innerWidth}x${innerHeight}`, shots: [] };
    const setView = name => document.querySelector(`.view-btn[data-view="${name}"]`)?.click();
    const ev = (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
    await sleep(2500);
    if (!v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(800); }
    setView('legacy');
    await sleep(900);
    out.shots.push(shot('大小窗 / legacy, trimming'));
    setView('front');
    await sleep(900);
    out.shots.push(shot('单路 front, trimming'));
    setView('grid');
    await sleep(900);
    out.shots.push(shot('六宫格, trimming'));
    // And the same two views without the trim, as the control.
    v.videoControls.toggleClipMode();
    await sleep(900);
    setView('front');
    await sleep(700);
    out.shots.push(shot('单路 front, NOT trimming'));
    setView('legacy');
    await sleep(700);
    out.shots.push(shot('大小窗, NOT trimming'));
    return out;
})()
