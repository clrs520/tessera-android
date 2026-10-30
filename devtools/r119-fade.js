// R119 第二步：把「面板还看得见」这段时间量出来，并确认它到底靠什么消失（opacity 淡出？
// visibility？display 立刻 none？）。rAF 在这台 AVD 上 700ms 只给了 1 帧（R112 记过），
// 所以这一版改用 setInterval(20ms) + transitionstart/end 事件，两头对齐。
(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const header = document.querySelector('.main-header');
    const panel = document.querySelector('.header-right .header-actions-group');
    const hr = document.getElementById('headerRight');
    const hud = document.getElementById('metadataPanel');
    const cs = getComputedStyle(panel);
    const out = {
        closedStyle: { opacity: cs.opacity, visibility: cs.visibility, display: cs.display,
            transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration,
            transitionDelay: cs.transitionDelay },
    };
    const topAtHud = () => {
        const r = hud.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit ? `${hit.tagName}.${(hit.className || '').toString().split(' ').slice(0, 2).join('.')}` : 'null';
    };
    const isPanel = (t) => /header-actions-group|control-btn|btn-text|btn-icon|menu-divider|choice-segment|choice-label/.test(t);

    hr.classList.add('active');
    await sleep(500);
    out.open = { headerZ: getComputedStyle(header).zIndex, panelOp: getComputedStyle(panel).opacity, topAtHud: topAtHud() };

    // t0 必须在挂监听之前就存在：开面板那一下也会 fire transitionrun，处理器里读未初始化的
    // const 会抛 ReferenceError，而那会被 APP 自己的错误兜底记进账本（R93 记过）。
    let t0 = performance.now();
    const events = [];
    const handlers = {};
    ['transitionrun', 'transitionstart', 'transitionend', 'transitioncancel'].forEach(kind => {
        handlers[kind] = (e) => {
            if (e.target !== panel) return;
            events.push({ kind, t: Math.round(performance.now() - t0),
                headerZ: getComputedStyle(header).zIndex, panelOp: getComputedStyle(panel).opacity });
        };
        panel.addEventListener(kind, handlers[kind]);
    });

    const frames = [];
    t0 = performance.now();
    hr.classList.remove('active');
    for (let i = 0; i < 60; i++) {
        const s = getComputedStyle(panel);
        frames.push({ dt: Math.round(performance.now() - t0), op: s.opacity, vis: s.visibility,
            disp: s.display, headerZ: getComputedStyle(header).zIndex, top: topAtHud() });
        await sleep(20);
    }
    out.events = events;
    // 面板「还算看得见」的最后一帧 + 其中 HUD 压在它上面的帧数
    const visible = frames.filter(f => f.disp !== 'none' && f.vis !== 'hidden' && parseFloat(f.op) > 0.05);
    out.timeline = frames.filter((f, i) => i < 14 || (visible.includes(f) && i % 3 === 0));
    out.result = {
        visibleMs: visible.length ? visible[visible.length - 1].dt : 0,
        visibleFrames: visible.length,
        punchFrames: visible.filter(f => !isPanel(f.top)).length,
        firstPunchTop: (visible.find(f => !isPanel(f.top)) || {}).top || '-',
        headerZAtRemove: frames[0].headerZ,
        headerZDropsAt: (frames.find(f => f.headerZ !== out.open.headerZ) || { dt: -1 }).dt,
    };
    Object.entries(handlers).forEach(([kind, fn]) => panel.removeEventListener(kind, fn));
    return JSON.stringify(out);
})()
