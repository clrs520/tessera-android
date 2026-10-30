// R108 排查①决定性一问：⋮ 面板**关着**和**开着**时，求解器各收到哪几种墨色。
// 时间线（r108-panel-open-timeline.js）量到 `inks` 在面板打开那一拍从 9 变 10 —— 也就是 R107
// 那条「暂时看不见也要进约束」还没真正做到：有一种颜色只在打开之后才被算进来。
// 亮帧上这会直接把材质从「够用的最薄」推到「为那一种颜色加厚」，用户看到的就是
// 「先半透明，然后一下子变白底」。这里把多出来的那个颜色点名，并用出厂那段算术算它在
// 三种画面亮度下各自要多少 alpha —— 差值就是那一下跳变的量。
//
// 不碰播放：这台 AVD 今晚连着在 playEvent 之后 ANR（`Waited 5000ms for FocusEvent`），
// 而**墨色集合与播不播无关** —— 它是纯 DOM/CSS 的事。跳变幅度改用三种合成底色（夜路 37 /
// 普通白天 150 / 亮帧 253）算，反而比等一条真视频更可控。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // 用元素本身而不是 `.header-collapsed …`：首页那一屏 header 没折叠，选择器会整个落空，
    // 而「这一面有哪些墨色」问的是节点，与它此刻算不算玻璃面无关。
    const SEL = '#headerActionsGroup';
    const tag = (n) => ((typeof n.className === 'string' && n.className) || n.tagName) + '';
    const parseInk = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    // **完全照运行时的规则收集**（运行时只跳 display:none）：否则「我看到的漏」和「它实际的漏」是两回事。
    const collect = () => {
        const el = document.querySelector(SEL);
        if (!el) return { inks: [], skipped: [] };
        const cs = getComputedStyle(el);
        const set = new Map();
        const skipped = [];
        for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
            if (!n.textContent || !n.textContent.trim()) continue;
            const s = getComputedStyle(n);
            if (s.display === 'none') { skipped.push(`${tag(n)}|${n.textContent.trim().slice(0, 8)}`); continue; }
            const c = parseInk(s.color);
            if (c.length !== 3) continue;
            const k = c.join(',');
            if (!set.has(k)) set.set(k, { cls: tag(n), txt: n.textContent.trim().slice(0, 10),
                vis: `${s.visibility}/${s.opacity}` });
        }
        return { fill: parseInk(cs.backgroundColor), inks: [...set].map(([k, m]) => ({ ink: k, ...m })), skipped };
    };
    const hdr = () => document.querySelector('.header-right');
    const v = window.viewer;

    const page = document.querySelector('.player-area.empty') ? '首页' : '播放页';
    if (hdr()?.classList.contains('active')) { document.getElementById('tabMoreBtn').click(); await sleep(900); }
    const closed = collect();
    document.getElementById('tabMoreBtn').click();
    for (let i = 0; i < 24 && +getComputedStyle(document.querySelector(SEL)).opacity !== 1; i++) await sleep(150);
    await sleep(600);
    const open = collect();

    const keys = (x) => new Set(x.inks.map((i) => i.ink));
    const added = open.inks.filter((i) => !keys(closed).has(i.ink));
    const removed = closed.inks.filter((i) => !keys(open).has(i.ink));
    const demand = (inkStr, L) => solveGlassAlpha([255, 255, 255], [L, L, L], [inkStr.split(',').map(Number)]);
    const base = (L) => solveGlassAlpha([255, 255, 255], [L, L, L], closed.inks.map((i) => i.ink.split(',').map(Number)));
    return {
        page, hasEvent: !!v.currentEvent,
        bd: `${glassState.src}/${glassState.luma}`, alphaNow: +glassState.alpha.toFixed(3), wantNow: glassState.target,
        closedCount: closed.inks.length, openCount: open.inks.length,
        closedInks: closed.inks.map((i) => `${i.ink}(${i.cls}:${i.txt}|${i.vis})`),
        closedSkipped: closed.skipped.slice(0, 14),
        added: added.map((i) => `${i.ink}(${i.cls}:${i.txt}|${i.vis})`),
        removed: removed.map((i) => i.ink),
        jump: [37, 150, 253].map((L) => `底色${L}：关着解 ${base(L).toFixed(3)} → 开着解 `
            + `${Math.max(base(L), ...added.map((a) => demand(a.ink, L))).toFixed(3)}`
            + `（多出来的墨单独要 ${added.map((a) => demand(a.ink, L).toFixed(3)).join('/')}）`)
    };
})();
