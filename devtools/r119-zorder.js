// R119 排查：关掉 ⋮ 面板那一下，行车数据 HUD 卡片画在「还看得见」的面板之上。
// 假设：抬层是 `.main-header:has(.header-right.active){z-index:1700}`，摘 .active 的**同一帧**
// 就掉回 50，而面板退场还有 0.2s 淡出（R112 特意保留退场淡出）—— 这 200ms 里 HUD(z=100) 压着它。
// 量法：rAF 逐帧采（这台 AVD ~3fps，setInterval 会整个跨过 0.2s 动画 = R112 记过的坑），
// 每帧记 ① 两个面的 computed z-index ② 面板 opacity/visibility ③ HUD 中心点 elementFromPoint
// 命中谁（真命中，不是推断）④ 两盒是否几何相交。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const header = document.querySelector('.main-header');
    const panel = document.querySelector('.header-right .header-actions-group');
    const hr = document.getElementById('headerRight');
    const hud = document.getElementById('metadataPanel');
    const out = { orient: `${innerWidth}x${innerHeight}@${devicePixelRatio}` };
    if (!header || !panel || !hr || !hud) return JSON.stringify({ err: 'MISSING NODES',
        header: !!header, panel: !!panel, hr: !!hr, hud: !!hud });

    const box = (el) => { const r = el.getBoundingClientRect();
        return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
            t: Math.round(r.top * 10) / 10, b: Math.round(r.bottom * 10) / 10,
            l: Math.round(r.left * 10) / 10, r: Math.round(r.right * 10) / 10 }; };
    const overlap = (a, b) => !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t);
    const snap = (tag) => {
        const hs = getComputedStyle(header), ps = getComputedStyle(panel), cs = getComputedStyle(hud);
        const hb = box(hud);
        const hit = document.elementFromPoint(hb.l + hb.w / 2, hb.t + hb.h / 2);
        return { tag, t: Math.round(performance.now()),
            headerZ: hs.zIndex, headerPos: hs.position,
            hudZ: cs.zIndex, hudDisp: cs.display, hudVis: cs.visibility, hudOp: cs.opacity,
            panelOp: ps.opacity, panelVis: ps.visibility, panelDisp: ps.display,
            active: hr.classList.contains('active'),
            topAtHud: hit ? `${hit.tagName}.${(hit.className || '').toString().split(' ').slice(0, 2).join('.')}` : 'null',
            hudOverPanelBox: overlap(hb, box(panel)), hudBox: hb };
    };

    // 前提自证：HUD 必须真的有盒（没在播 / 没数据时它是 0×0，那时候「压在上层」无从谈起）。
    if (box(hud).w < 1 || box(hud).h < 1) {
        return JSON.stringify(Object.assign(out, { err: 'HUD HAS NO BOX（先起播再量）', hud: snap('pre') }));
    }

    hr.classList.add('active');
    await sleep(500);
    out.open = snap('open');

    // 逐帧采关闭全过程
    const frames = [];
    const t0 = performance.now();
    hr.classList.remove('active');
    await new Promise((done) => {
        const step = () => {
            frames.push(snap('f' + frames.length));
            if (performance.now() - t0 > 700 || frames.length > 90) return done();
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });
    out.frames = frames;
    // 关键窗口：面板还看得见（opacity>0.05 且 visibility 没成 hidden）时，HUD 是不是在它上面
    out.visibleWhileClosing = frames.filter(f => parseFloat(f.panelOp) > 0.05 && f.panelVis !== 'hidden');
    out.punchThrough = out.visibleWhileClosing.filter(f => f.topAtHud !== 'null'
        && !/header-actions-group|control-btn|btn-text|btn-icon/.test(f.topAtHud));
    out.zDropFrame = frames.find(f => f.headerZ !== out.open.headerZ);
    out.lastVisible = out.visibleWhileClosing[out.visibleWhileClosing.length - 1] || null;
    out.summary = {
        openHeaderZ: out.open.headerZ, openPanelOp: out.open.panelOp,
        framesWhileVisible: out.visibleWhileClosing.length,
        punchThroughFrames: out.punchThrough.length,
        firstPunch: out.punchThrough[0] || null,
        headerZAfterRemove: out.zDropFrame ? { t: out.zDropFrame.t, from: out.open.headerZ, to: out.zDropFrame.headerZ,
            panelOpAtThatFrame: out.zDropFrame.panelOp } : '未变',
        hudZ: out.open.hudZ,
    };
    return JSON.stringify(out);
})()
