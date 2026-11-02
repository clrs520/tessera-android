// R214 判据：底栏选中态的「一枚会滑动的胶囊」（A+C）
//   ① 透镜矩形必须与亮着那一格的矩形重合（四边各 ≤1 px，含栏内 padding 与格间 gap 的真实布局）
//   ② 透镜不能盖住图标/文字：在标签中心做命中测试，命中的必须是格内元素
//   ③ 两层都落下时透镜淡出（R58 的「没有第三态」语义不变）
//   ④ 迁移是过渡（transform 有 0.22s），但 prefers-reduced-motion 下只留淡入淡出
// 跑法：CDP_TIMEOUT_MS=60000 ADB_SERIAL=<serial> CDP_PORT=9450 node devtools/cdp-eval.mjs --file devtools/r214-lens.js
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const checks = [];
    const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail: String(detail) });
    const box = el => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const near = (a, b) => Math.max(Math.abs(a.l - b.l), Math.abs(a.t - b.t), Math.abs(a.r - b.r), Math.abs(a.b - b.b)) <= 1;

    const lens = document.getElementById('tabLens');
    const listBtn = document.getElementById('tabListBtn');
    const moreBtn = document.getElementById('tabMoreBtn');
    ok('前置：透镜元素与两个亮得起来的格都在', !!lens && !!listBtn && !!moreBtn,
        `lens=${!!lens} list=${!!listBtn} more=${!!moreBtn}`);
    if (!lens || !listBtn || !moreBtn) return { checks };

    const trans = getComputedStyle(lens).transition;
    ok('前置：迁移是过渡而不是硬跳', /0\.22s/.test(trans), trans);
    ok('前置：透镜默认不参与命中（pointer-events:none）',
        getComputedStyle(lens).pointerEvents === 'none', getComputedStyle(lens).pointerEvents);

    // ---- 抽屉打开：应当亮「片段」 ----
    v.toggleSidebar && v.toggleSidebar(true);
    await sleep(700);
    const onList = { on: listBtn.classList.contains('on'), cur: listBtn.getAttribute('aria-current') };
    const lensA = box(lens), btnA = box(listBtn);
    ok('抽屉打开时「片段」是选中态（.on + aria-current）', onList.on && onList.cur === 'true', JSON.stringify(onList));
    ok('透镜落在「片段」那一格上（四边差 ≤1 px）', near(lensA, btnA),
        `lens=${Math.round(lensA.l)},${Math.round(lensA.t)},${Math.round(lensA.w)}x${Math.round(lensA.h)} btn=${Math.round(btnA.l)},${Math.round(btnA.t)},${Math.round(btnA.w)}x${Math.round(btnA.h)}`);
    ok('透镜不透明可见', parseFloat(getComputedStyle(lens).opacity) > 0.99, getComputedStyle(lens).opacity);
    // 竖屏下抽屉（sheet）整片盖住底栏，标签此刻不可见 ⇒ 命中测试要挪到底栏露出来的那一档

    // ---- 抽屉关、⋮面板开：应当滑到「设置」 ----
    v.toggleSidebar && v.toggleSidebar(false);
    await sleep(300);
    const hr = document.getElementById('headerRight');
    if (hr) hr.classList.add('active');
    v.syncTabSelection && v.syncTabSelection();
    await sleep(500);
    const lensB = box(lens), btnB = box(moreBtn);
    ok('切到「设置」后透镜滑到那一格（四边差 ≤1 px）', near(lensB, btnB),
        `lens=${Math.round(lensB.l)},${Math.round(lensB.t)},${Math.round(lensB.w)} btn=${Math.round(btnB.l)},${Math.round(btnB.t)},${Math.round(btnB.w)}`);
    const labelRect = box(moreBtn.querySelector('.tab-label'));
    const hit = document.elementFromPoint(labelRect.l + labelRect.w / 2, labelRect.t + labelRect.h / 2);
    ok('底栏露出来时，透镜没盖住文字（标签中心命中的是格内元素）',
        !!hit && hit !== lens && hit.closest('#tabMoreBtn') === moreBtn,
        hit ? `${hit.tagName}.${String(hit.className).slice(0, 24)}` : 'none');
    ok('这一趟确实是「滑」过去的（左边界位移 > 100 px）', Math.abs(lensB.l - lensA.l) > 100,
        `Δleft=${Math.round(lensB.l - lensA.l)}`);

    // ---- 两层都落下：淡出 ----
    if (hr) hr.classList.remove('active');
    v.syncTabSelection && v.syncTabSelection();
    await sleep(400);
    const opa = parseFloat(getComputedStyle(lens).opacity);
    ok('两层都落下时透镜淡出（没有任何一格亮着）', opa < 0.05, `opacity=${opa}`);

    const red = checks.filter(c => !c.pass);
    return { verdict: `${checks.length - red.length}/${checks.length}`, red: red.map(x => `${x.name} = ${x.detail}`), checks };
})()
