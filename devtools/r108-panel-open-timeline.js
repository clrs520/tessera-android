// R108 排查①：真机「点设置弹出卡片，先半透明、一下子又变白底」。
// 两个候选机制要分开量，不能凭观感选：
//   A. 底色 alpha 真的跳了（求解器在面板打开后才把这一面的墨色纳进约束）；
//   B. 跳的不是底色而是**滤镜**：`.lens-on` 是 250ms 的几何 tick 才挂上的，
//      挂上之前是 blur(22px) saturate(180%)，之后是 url(#tesseraLens) blur(16px) … brightness(1.04)。
//      薄玻璃上「看起来亮不亮」几乎全由后景那层滤镜决定，brightness(1.04) + linearRGB 会把它整体提亮。
// 所以每 100ms 同时记 底色 / backdrop-filter / 透明度 / 面板是否真的可见，一条时间线判 A 还是 B。
// 打开走**用户那条路径**（点 tabMoreBtn），不是 classList 硬加 —— 要看的就是真实打开时序。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const SEL = '.header-collapsed .header-actions-group';
    const cs = (p) => { const n = document.querySelector(SEL); return n ? getComputedStyle(n)[p] : 'missing'; };
    const bg = () => cs('backgroundColor');
    const bf = () => { const n = document.querySelector(SEL); if (!n) return 'missing';
        const c = getComputedStyle(n);
        return (c.backdropFilter && c.backdropFilter !== 'none' ? c.backdropFilter : c.webkitBackdropFilter) || 'none'; };
    const out = { baseline: [], timeline: [], notes: {} };

    if (document.querySelector('.player-area.empty')) {
        const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')))
            || (v.eventGroups || [])[0];
        await v.playEvent(ev.eventId);
        await sleep(3200);
    }
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    await sleep(1200);
    const hdr = () => document.querySelector('.header-right');
    if (hdr()?.classList.contains('active')) { document.getElementById('tabMoreBtn').click(); await sleep(700); }

    const snap = (t) => ({ t, alpha: +glassState.alpha.toFixed(3), want: glassState.target,
        inks: glassState.inks, lensOn: glassState.lensLive, bd: `${glassState.src}/${glassState.luma}`,
        bg: bg(), bf: bf().slice(0, 26), op: cs('opacity'), act: hdr()?.classList.contains('active') ? 1 : 0 });
    for (let i = 0; i < 5; i++) { out.baseline.push(snap(-500 + i * 100)); await sleep(100); }

    document.getElementById('tabMoreBtn').click();
    for (let i = 0; i < 26; i++) { out.timeline.push(snap(i * 100)); await sleep(100); }

    // 读数之后再看一次稳态，确认「跳过去的那个值」就是它长期停着的地方（不是一次性抖动）。
    await sleep(1500);
    out.notes.steady = snap('steady');
    const alphas = out.timeline.map((r) => r.alpha);
    const bfs = out.timeline.map((r) => /url\(/.test(r.bf) ? 'lens' : 'blur');
    out.notes.alphaJump = Math.max(...alphas) - Math.min(...alphas);
    out.notes.firstLensMs = bfs.indexOf('lens') * 100;
    out.notes.lensChanged = new Set(bfs).size > 1;
    out.notes.bgChanged = new Set(out.timeline.map((r) => r.bg)).size > 1;
    out.notes.inkChanged = new Set(out.timeline.map((r) => r.inks)).size > 1;
    return out;
})();
