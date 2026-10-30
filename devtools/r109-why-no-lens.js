// 取证，不是判据：1.2.185 上竖屏套件那 5 条「⋮ 面板压在画面上 ⇒ 该面在折射」全红，且
// `active=1` 能撑住 3.6 秒而 `lensLive=0`。这一份只回答一件事 —— `markLensSurfaces()` 那三道闸
// （有画面 rect / 这一面看得见 / 重叠 ≥2%）究竟是哪一道没过去。
// 判据一律不写在这里：本轮要的是成因，写死「应该绿」只会诱我把读数解释成我想要的样子。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const SEL = '.header-collapsed .header-actions-group';
    const cs = (sel, p) => { const n = document.querySelector(sel); return n ? getComputedStyle(n)[p] : null; };
    const r = (o) => { const b = o.getBoundingClientRect();
        return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), rt: Math.round(b.right),
            w: Math.round(b.width), h: Math.round(b.height) }; };
    const out = {};
    out.htmlCls = document.documentElement.className.slice(0, 120);
    out.bodyCls = String(document.body.className).slice(0, 120);
    out.view = (() => { const p = document.querySelector('.player-area');
        return p ? p.className.slice(0, 90) : 'no .player-area'; })();
    out.orient = `${innerWidth}x${innerHeight}@${devicePixelRatio}`;
    out.event = v.currentEvent ? String(v.currentEvent.eventId || '').slice(-24) : 'none';
    out.playing = v.multiCameraPlayer.isPlaying;
    out.loadavg = 'see host';

    // ① 有画面 rect 吗：`markLensSurfaces` 只收「格子可见 + video 已经知道尺寸」的那几路。
    const cells = [...document.querySelectorAll('.video-container')];
    out.cells = cells.map((c) => {
        const vid = c.querySelector('video');
        const s = getComputedStyle(c);
        return { cls: c.className.replace(/\s+/g, ' ').slice(0, 34), display: s.display,
            vw: vid ? vid.videoWidth : -1, vh: vid ? vid.videoHeight : -1,
            rs: vid ? Math.round(vid.readyState) : -1, paused: vid ? vid.paused : null,
            rect: c.getBoundingClientRect ? r(c) : null };
    });
    const rects = [];
    for (const cell of cells) {
        if (getComputedStyle(cell).display === 'none' || cell.classList.contains('hidden')) continue;
        const vid = cell.querySelector('video');
        if (!vid || !vid.videoWidth || !vid.videoHeight) continue;
        const b = cell.getBoundingClientRect();
        const k = Math.min(b.width / vid.videoWidth, b.height / vid.videoHeight);
        const h = vid.videoHeight * k, w = vid.videoWidth * k;
        rects.push({ top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
            left: b.left + (b.width - w) / 2, right: b.left + (b.width + w) / 2 });
    }
    out.rectsCount = rects.length;

    // ② 面板看得见吗 + ③ 重叠多少
    const hdrActive = !!document.querySelector('.header-right')?.classList.contains('active');
    const el = document.querySelector(SEL);
    out.panel = { hdrActive, exists: !!el };
    if (el) {
        const s = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        const shown = s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0;
        let cov = 0;
        for (const p of rects) {
            const y = Math.min(b.bottom, p.bottom) - Math.max(b.top, p.top);
            const w = Math.min(b.right, p.right) - Math.max(b.left, p.left);
            if (y > 0 && w > 0) cov += y * w;
        }
        out.panel.shown = shown;
        out.panel.style = `display=${s.display} vis=${s.visibility} opacity=${s.opacity} z=${s.zIndex} tf=${String(s.transform).slice(0, 18)}`;
        out.panel.rect = r(el);
        out.panel.coverPct = b.width * b.height ? +(100 * Math.min(1, cov / (b.width * b.height))).toFixed(2) : -1;
        out.panel.lensOn = el.classList.contains('lens-on');
        out.panel.filter = (s.backdropFilter !== 'none' && s.backdropFilter ? s.backdropFilter : s.webkitBackdropFilter) || 'none';
    }
    out.surfaces = ['phone-action-bar', 'headerActionsGroup', 'cardContextMenu', 'metadataPanel', 'emptyHero']
        .map((n) => { const e = document.querySelector('.' + n.replace(/([A-Z])/g, '-$1').toLowerCase())
            || document.querySelector(`[class*="${n}"]`); return e ? `${n}:${e.classList.contains('lens-on') ? 'ON' : 'off'}` : `${n}:absent`; });

    // 亲手跑一遍开关：如果这道函数此刻自己就能算出 lensLive≥1，那「读不到」只能是节拍问题
    // （250ms 的 tick 在这台机器上被推后了），不是判据问题。
    const before = glassState.lensLive;
    if (typeof markLensSurfaces === 'function') markLensSurfaces();
    out.forcedRun = { before, after: glassState.lensLive };
    // 再等三拍看它自己走不走：这一台在负载 7+ 时定时器会被推后到几百毫秒一拍。
    const trace = [];
    const t0 = Date.now();
    for (let i = 0; i < 5; i++) {
        await sleep(200);
        trace.push(`${Date.now() - t0}ms:lens=${glassState.lensLive}${document.querySelector(SEL) && document.querySelector(SEL).classList.contains('lens-on') ? '+P' : ''}`);
    }
    out.tickTrace = trace.join(' ');
    out.glass = `src=${glassState.src} luma=${glassState.luma} cells=${glassState.cells} alpha=${glassState.alpha.toFixed(3)} want=${glassState.target.toFixed(3)} solved=${glassState.solved}`;
    return out;
})().catch((e) => ({ probeError: `${e && e.name}: ${e && e.message}`, stack: String(e && e.stack || '').slice(0, 400) }));
