// R100-2 acceptance, portrait. The claim is narrow: while trimming, the driving-data card must not
// cover the picture, and only the views that actually reached that low may give any room.
//
// Everything is measured against the painted frame (`object-fit: contain`), not the cell — R83 is why
// that distinction exists — and every expectation is compared against the same view's own pre-trim
// baseline rather than a number remembered from another session: `--controls-h`, and with it the card's
// dock, is smaller once the clip row is gone, so a hardcoded "should be back at 326.9" fails for
// reasons that have nothing to do with the fix.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const root = getComputedStyle(document.documentElement);
    const dom = id => document.getElementById(id) || document.querySelector(`#${id}`);
    const card = () => (dom('metadataPanel') || document.querySelector('.metadata-panel')).getBoundingClientRect();
    const setView = n => document.querySelector(`.view-btn[data-view="${n}"]`)?.click();
    const painted = (video, cell) => {
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const h = video.videoHeight * s;
        return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2, h };
    };
    const frames = () => [...document.querySelectorAll('.video-container')]
        .filter(c => getComputedStyle(c).display !== 'none' && !c.classList.contains('hidden'))
        .map(c => ({ cam: c.dataset.camera || '?', p: painted(c.querySelector('video'), c) }))
        .filter(x => x.p);
    // What the user reported, in px of frame hidden behind the card.
    const covered = () => {
        const c = card();
        return frames().map(x => ({ cam: x.cam,
            over: +Math.max(0, Math.min(c.bottom, x.p.bottom) - Math.max(c.top, x.p.top)).toFixed(1),
            h: +x.p.h.toFixed(1) })).filter(x => x.over > 0.5);
    };
    const snap = label => ({ label, cardTop: +card().top.toFixed(1), cardBottom: +card().bottom.toFixed(1),
        covered: covered(), frames: frames().map(x => `${x.cam}:${x.p.h.toFixed(0)}@${x.p.top.toFixed(0)}`) });
    const visit = async views => {
        const seen = {};
        for (const view of views) { setView(view); await sleep(900); seen[view] = snap(view); }
        return seen;
    };

    const VIEWS = ['front', 'legacy', 'grid', 'grid4'];
    const ev = (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
    await sleep(2500);
    if (v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(900); }

    const before = await visit(VIEWS);
    ok('基线：非剪辑态下四个视图都量到了画面', VIEWS.every(k => before[k].frames.length > 0),
        VIEWS.map(k => `${k}=${before[k].frames.length}`).join(' '));

    if (!v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(900); }
    ok('剪辑态确实开着', document.body.classList.contains('clip-trimming'));
    const hudH = parseFloat(root.getPropertyValue('--hud-h'));
    ok('卡片把自己的高度发布成了 --hud-h（预留量是量出来的，不是猜的）',
        hudH >= 30 && hudH <= 140, `--hud-h=${root.getPropertyValue('--hud-h').trim()}`);

    const during = await visit(VIEWS);
    ok('单路：卡片不压画面', during.front.covered.length === 0, JSON.stringify(during.front.covered));
    ok('大小窗：卡片不压任何一格', during.legacy.covered.length === 0, JSON.stringify(during.legacy.covered));
    ok('六宫格：卡片不压画面', during.grid.covered.length === 0, JSON.stringify(during.grid.covered));
    ok('四宫格：卡片不压画面', during.grid4.covered.length === 0, JSON.stringify(during.grid4.covered));
    const frontH = f => f.frames.map(s => +s.split(':')[1].split('@')[0]);
    ok('单路：画面只是上移，没有变小',
        JSON.stringify(frontH(during.front)) === JSON.stringify(frontH(before.front)),
        `during=${during.front.frames} before=${before.front.frames}`);
    // The mechanism has to be visible, not just the absence of a symptom. R101-3 made the yield
    // permanent (the card covers the picture in the plain playing state too), so "it moved up when
    // trimming started" is no longer the signature — the picture is already up. Prove the reserve is
    // what holds it there instead: take `--hud-h` away for one measurement and watch the frame sink
    // back into the card's band, then put it back.
    const frontTop = () => {
        const f = frames().find(x => x.cam === 'front') || frames()[0];
        return f ? +f.p.top.toFixed(1) : null;
    };
    // `visit()` ends on 四宫格, and that view deliberately has no reserve — measuring there made this
    // criterion read a cell that cannot move and call it proof.
    setView('front');
    await sleep(900);
    const style = document.documentElement.style;
    const savedHud = style.getPropertyValue('--hud-h');
    style.setProperty('--hud-h', '0px');
    await sleep(700);
    const unlifted = frontTop();
    style.removeProperty('--hud-h');
    if (savedHud) style.setProperty('--hud-h', savedHud);
    await sleep(700);
    const lifted = frontTop();
    ok('单路：画面确实是被预留量抬着的（抽掉 --hud-h 它就沉回卡片那一条）',
        unlifted !== null && lifted !== null && unlifted > lifted + 8 && during.front.cardTop <= before.front.cardTop + 0.5,
        `无预留 top=${unlifted} 有预留 top=${lifted}（剪辑态卡片 ${before.front.cardTop} → ${during.front.cardTop}）`);
    // The views that never reached that low must come out exactly as they were.
    for (const view of ['grid', 'grid4']) {
        ok(`${view}：不需要的视图一格高度都没变`,
            JSON.stringify(frontH(during[view])) === JSON.stringify(frontH(before[view])),
            `during=${during[view].frames} before=${before[view].frames}`);
    }
    const strip = document.querySelector('.clip-filmstrip');
    ok('卡片不压胶片条', !strip || card().bottom <= strip.getBoundingClientRect().top + 0.5,
        `cardBottom=${card().bottom.toFixed(1)} stripTop=${strip ? strip.getBoundingClientRect().top.toFixed(1) : 'none'}`);

    v.videoControls.toggleClipMode();
    await sleep(900);
    const after = await visit(['front', 'legacy']);
    for (const view of ['front', 'legacy']) {
        ok(`退出剪辑后 ${view} 回到基线位置`,
            JSON.stringify(after[view].frames) === JSON.stringify(before[view].frames),
            `after=${after[view].frames} before=${before[view].frames}`);
    }
    out.orient = `${innerWidth}x${innerHeight}`;
    out.baseline = before;
    out.trimming = during;
    return out;
})()
