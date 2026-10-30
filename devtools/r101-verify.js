// R101 acceptance, portrait. Four claims to settle:
//  ① the bottom bar's caption names the picture, not the stored preference (view chips, tap-to-zoom
//     both ways, the silent decoder downgrade);
//  ② an unbuildable export plan hides the preview for a pass instead of switching the user's
//     preference off for good;
//  ③ the driving-data card yields its band in BOTH states (trim was R100, this adds 非剪辑) while
//     six-up and four-up give nothing;
//  ④ a forward frame step can never move the picture backwards, and 复制诊断 now says so.
//
// Instruments carried over from today's false signals: the measurement base is asserted before any
// geometry is judged (the 最近片段 pseudo-event plays a portrait clip, which makes every "no overlap"
// reading meaningless), the card must be live (`has-data`) before it can cover anything, and every
// expectation compares against this session's own baseline rather than a remembered number.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [], skip: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const root = getComputedStyle(document.documentElement);
    const dom = id => document.getElementById(id) || document.querySelector(`#${id}`);
    const cardEl = () => dom('metadataPanel') || document.querySelector('.metadata-panel');
    const card = () => cardEl().getBoundingClientRect();
    const setView = n => document.querySelector(`.view-btn[data-view="${n}"]`)?.click();
    const L = () => i18n[v.currentLanguage];
    const caption = () => (dom('tabLayoutLabel').textContent || '').trim();

    const painted = (video, cell) => {
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const h = video.videoHeight * s, w = video.videoWidth * s;
        return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
            left: b.left + (b.width - w) / 2, right: b.left + (b.width + w) / 2, h, w };
    };
    const frames = () => [...document.querySelectorAll('.video-container')]
        .filter(c => getComputedStyle(c).display !== 'none' && !c.classList.contains('hidden'))
        .map(c => ({ cam: c.dataset.camera || '?', p: painted(c.querySelector('video'), c) }))
        .filter(x => x.p);
    // The user's complaint is in px of picture hidden behind the card, and it is only a real
    // complaint when the card is actually showing data.
    const covered = () => {
        if (!cardEl().classList.contains('has-data')) return null;
        const c = card();
        return frames().map(x => ({ cam: x.cam,
            over: +Math.max(0, Math.min(c.bottom, x.p.bottom) - Math.max(c.top, x.p.top)).toFixed(1),
            h: +x.p.h.toFixed(1) })).filter(x => x.over > 0.5);
    };
    const snap = label => ({ label, cardTop: +card().top.toFixed(1), cardBottom: +card().bottom.toFixed(1),
        caption: caption(), covered: covered(),
        frames: frames().map(x => `${x.cam}:${x.p.h.toFixed(0)}@${x.p.top.toFixed(0)}`) });
    const VIEWS = ['front', 'legacy', 'grid', 'grid4'];
    const visit = async () => {
        const seen = {};
        for (const view of VIEWS) { setView(view); await sleep(900); seen[view] = snap(view); }
        return seen;
    };
    // The transport row auto-hides (`opacity:0; pointer-events:none`), and a 400 ms sleep is not
    // enough to catch it open — R99's chips all "missed" for exactly this reason.
    const waitControlsVisible = async () => {
        const bar = document.querySelector('.video-controls-overlay');
        for (let i = 0; i < 40; i += 1) {
            if (bar && +getComputedStyle(bar).opacity === 1) return true;
            document.querySelector('.player-area')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            await sleep(120);
        }
        return false;
    };

    // ---- 0. Is this a valid measurement base at all? ------------------------------------------
    const ev = (v.eventGroups || []).find(e => !/RecentClips/i.test(String(e.eventId || '')))
        || (v.eventGroups || [])[0];
    if (document.querySelector('.player-area.empty')) await v.playEvent(ev.eventId);
    await sleep(3000);
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    const base = await waitControlsVisible();
    setView('front'); await sleep(900);
    const single = frames()[0];
    ok('量具基准：控件行是可见的（否则后面的点击全部落空）', base);
    ok('量具基准：打开的是真实多路事件，不是 最近片段', !/RecentClips/i.test(String(ev.eventId || '')),
        String(ev.eventId || '').slice(-24));
    ok('量具基准：单路画面是横向的（竖画面会让「不遮挡」变成空话）',
        !!single && single.p.w / single.p.h >= 1.2, single ? `${single.p.w.toFixed(0)}x${single.p.h.toFixed(0)}` : 'no frame');
    ok('量具基准：行车数据卡片当前有数据（没有数据的卡片压不到任何东西）',
        cardEl().classList.contains('has-data'));
    if (out.fail.length) return { aborted: '量具基准无效，几何判据不作数', ...out };

    // ---- 1. The caption follows the picture ----------------------------------------------------
    // The invariant is one sentence: whatever the bar says, that is what is on screen. Testing the
    // invariant at every mutation beats naming each layout, because a layout the app gains tomorrow
    // needs a new expectation — it does not need a new bug.
    const NAMES = () => ({ grid4: L().layoutGrid4, grid: L().layoutGrid6,
        legacy: L().layoutLegacy, single: L().layoutSingle });
    const matchesPicture = () => {
        const want = v.currentEvent ? NAMES()[v.multiCameraPlayer.layoutMode] : NAMES()[localStorage.getItem('tdashcam.layout') || 'grid4'];
        return { ok: want !== undefined && caption() === want, want, live: v.multiCameraPlayer.layoutMode };
    };
    const checkCaption = (when) => {
        const m = matchesPicture();
        ok(`${when}：tab 说的就是画面上的布局`, m.ok, `caption=${caption()} 应为=${m.want} live=${m.live}`);
    };
    setView('front'); await sleep(800);
    checkCaption('点视角 chips 到单路');
    setView('grid4'); await sleep(800);
    checkCaption('切到 4 宫格');
    // Tap-to-zoom: both directions have to repaint, which is the pair R58 missed.
    v.zoomCamera('back'); await sleep(900);
    checkCaption('放大某一路');
    v.zoomCamera('back'); await sleep(900);
    checkCaption('取消放大，回到来源布局');
    setView('legacy'); await sleep(800);
    checkCaption('大小窗');
    // The silent decoder downgrade is the fourth writer, and the one that never touches the
    // preference — exactly the case the stored-preference read used to miss.
    v.multiCameraPlayer.setLayout('grid');
    v.decodeDowngraded = false;
    v.markFeedDecodeError('front'); await sleep(700);
    checkCaption('解码降级之后');
    // English user, same rule (the caption is a translated word, not a Chinese-only label).
    v.setLanguage('en'); await sleep(800);
    checkCaption('切英文之后');
    v.setLanguage('zh'); await sleep(800);
    checkCaption('切回中文之后');

    // ---- 2. Geometry, both states --------------------------------------------------------------
    setView('front'); await sleep(700);
    const before = await visit();
    ok('非剪辑：四个视图都量到了画面', VIEWS.every(k => before[k].frames.length),
        VIEWS.map(k => `${k}=${before[k].frames.length}`).join(' '));
    const nonTrimBad = VIEWS.filter(k => (before[k].covered || []).length);
    ok('非剪辑：卡片不压任何视图的画面', nonTrimBad.length === 0,
        VIEWS.map(k => `${k}:${(before[k].covered || []).map(c => `${c.cam}压${c.over}px`).join('+') || '无'}`).join(' '));
    const hudH = parseFloat(root.getPropertyValue('--hud-h'));
    ok('卡片把自己的高度发布成了 --hud-h（预留量是量出来的）', hudH >= 40 && hudH <= 130,
        (root.getPropertyValue('--hud-h') || '').trim());

    if (!v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(1000); }
    ok('剪辑态确实开着', document.body.classList.contains('clip-trimming'));
    const during = await visit();
    const trimBad = VIEWS.filter(k => (during[k].covered || []).length);
    ok('剪辑：卡片不压任何视图的画面（R100 不回归）', trimBad.length === 0,
        VIEWS.map(k => `${k}:${(during[k].covered || []).map(c => `${c.cam}压${c.over}px`).join('+') || '无'}`).join(' '));
    const stripTop = document.querySelector('.clip-filmstrip')?.getBoundingClientRect().top;
    ok('剪辑：卡片让开胶片条', card().bottom <= stripTop + 0.5,
        `cardBottom=${card().bottom.toFixed(1)} stripTop=${(stripTop ?? -1).toFixed(1)}`);
    // The yield is a lift, not a shrink: the frame inside a width-limited cell re-centres.
    ok('单路：画面没有变小（只是上移）',
        Math.abs(during.front.frames[0].split(':')[1].split('@')[0] - before.front.frames[0].split(':')[1].split('@')[0]) < 1,
        `before=${before.front.frames[0]} during=${during.front.frames[0]}`);
    ok('六宫格：一格高度没有被改动（不需要让的视图一律不让）',
        during.grid.frames.join(',') === before.grid.frames.join(','),
        `during=${during.grid.frames.join(',')} before=${before.grid.frames.join(',')}`);
    ok('四宫格：一格高度没有被改动',
        during.grid4.frames.join(',') === before.grid4.frames.join(','),
        `during=${during.grid4.frames.join(',')} before=${before.grid4.frames.join(',')}`);

    v.videoControls.toggleClipMode(); await sleep(1100);
    setView('front'); await sleep(900);
    const after = await visit();
    VIEWS.forEach(k => ok(`退出剪辑后 ${k} 回到本轮基线`,
        after[k].frames.join(',') === before[k].frames.join(','),
        `after=${after[k].frames.join(',')} before=${before[k].frames.join(',')}`));

    // ---- 3. A transient plan error must not eat the user's preview switch ----------------------
    await v.showPhoneExportModal();
    await sleep(1800);
    const cs = v.videoControls;
    const savedFrom = cs.clipStartTime, savedTo = cs.clipEndTime;
    const wasOn = v.pePreviewOn;
    ok('导出页开局预览是开着的（R90 的钉底带）', wasOn === true, `pePreviewOn=${wasOn}`);
    // Reproduce the real cause: drag the out point in front of the in point and re-render.
    cs.clipEndTime = savedFrom;
    v.renderPhoneExportLayout(v.phoneExportPlan());
    await sleep(400);
    ok('算不出计划的这一拍：用户的开关没有被改掉', v.pePreviewOn === true, `pePreviewOn=${v.pePreviewOn}`);
    ok('算不出计划的这一拍：原因被记下来了（plan-error 而不是静默）', v.pePlanIssue === 'plan-error', v.pePlanIssue);
    cs.clipEndTime = savedTo;
    v.renderPhoneExportLayout(v.phoneExportPlan());
    await sleep(600);
    const dockShown = (dom('pePreviewCanvas')?.style.display || '') !== 'none';
    ok('计划恢复后预览自己回来了（不需要用户再开一次）',
        v.pePreviewOn === true && v.pePlanIssue === '' && dockShown,
        `on=${v.pePreviewOn} issue=${v.pePlanIssue || '-'} dock=${dockShown ? '显示' : '仍藏'}`);
    // And the switch is still the user's to own: turning it off stays off across the same error.
    v.togglePhoneExportPreview(); await sleep(300);
    cs.clipEndTime = savedFrom;
    v.renderPhoneExportLayout(v.phoneExportPlan());
    cs.clipEndTime = savedTo;
    v.renderPhoneExportLayout(v.phoneExportPlan());
    await sleep(400);
    ok('用户主动关掉的预览不会被这条路径偷偷打开', v.pePreviewOn === false, `pePreviewOn=${v.pePreviewOn}`);
    v.togglePhoneExportPreview(); await sleep(300);
    await v.hidePhoneExportModal();
    await sleep(900);

    // ---- 4. Frame stepping cannot go backwards --------------------------------------------------
    setView('front'); await sleep(600);
    if (v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(800); }
    await v.continuousPlayer.seekToTime(0.35 * cs.totalDuration);
    await sleep(1400);
    const led0 = { ...(v.videoControls.stepLedger || {}) };
    const t0 = v.continuousPlayer.getCurrentTime();
    for (let i = 0; i < 4; i += 1) { await v.phoneStepFrame(1); await sleep(700); }
    const t1 = v.continuousPlayer.getCurrentTime();
    const led1 = v.videoControls.stepLedger || {};
    ok('逐帧步进真的向前走了（不是原地不动）', t1 > t0 + 0.15, `t ${t0.toFixed(3)} → ${t1.toFixed(3)}`);
    ok('台账里没有出现「按向前却后退」', (led1.back || 0) === (led0.back || 0), `back=${led1.back}`);
    ok('台账里没有出现「起点越过了片尾」', (led1.over || 0) === (led0.over || 0),
        `claimPastEnd=${led1.over} worst=${(led1.worstOver || 0).toFixed(2)}s`);
    for (let i = 0; i < 4; i += 1) { await v.phoneStepFrame(-1); await sleep(600); }
    ok('反向逐帧同样没有异常', (v.videoControls.stepLedger.back || 0) === 0, `back=${v.videoControls.stepLedger.back}`);

    // ---- 5. Diagnostics now carries the evidence ------------------------------------------------
    const geo = v.describePhoneGeometry();
    const text = geo.join('\n');
    ['layout ', 'exportPreview ', 'geom ', 'step '].forEach(k =>
        ok(`诊断带上了「${k.trim()}」这一项`, text.includes(k), k));
    ok('诊断新行不含 token / URL / 绝对路径（隐私红线）',
        !/token|https?:\/\/|\/storage\/|\\storage\\/i.test(text), text.replace(/\n/g, ' | ').slice(0, 200));
    ok('诊断里的 tab 项说的是当前画面', /live=/.test(text) && /caption=/.test(text), geo[0]);
    ok('诊断里的遮挡读数是个像素数', /cardOverPicture=\d+(\.\d+)?px/.test(text), geo[2]);

    // ---- 6. The panel's three row kinds start at one x ------------------------------------------
    // Reading `padding-left` rather than the ink: a labelled row puts a 24px glyph in front of its
    // text and a heading does not, so the ink can only ever differ. What the user is asking for is
    // that the three rows share the left edge they are given.
    document.querySelector('.header-right')?.classList.add('active');
    await sleep(700);
    const padL = sel => { const n = document.querySelector(sel);
        return n ? parseFloat(getComputedStyle(n).paddingLeft) : null; };
    const rows = { 标题: padL('.header-actions-group .menu-divider'),
        按钮: padL('.header-actions-group button:not(.menu-choice)'),
        直选: padL('.header-actions-group .menu-choice') };
    const vals = Object.entries(rows).filter(([, x]) => x !== null);
    ok('⋮ 面板三种行都量到了左内缩', vals.length === 3, JSON.stringify(rows));
    ok('⋮ 面板三种行的左内缩是同一个值', new Set(vals.map(([, x]) => x)).size === 1,
        vals.map(([k, x]) => `${k}=${x}px`).join(' '));
    document.querySelector('.header-right')?.classList.remove('active');
    await sleep(500);

    return { orient: `${innerWidth}x${innerHeight}`, caption: caption(), pass: out.pass, fail: out.fail,
        before, during, after, geo, rows };
})()
