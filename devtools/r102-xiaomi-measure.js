// R102-2 Xiaomi 14 pass — a measurement sheet, not a verdict. The AVD is 412 CSS px wide and the
// user's phone is 436 (1200x2670 @ ~440dpi, HyperOS default) with a worst case of 400 when 显示大小
// is at its smallest, so every number here is read at whatever viewport the device is currently set
// to and compared by hand against the 412 baseline.
//
// Traps already paid for and respected below: `getPropertyValue` with a camelCase name returns ""
// (only custom properties go through it); `scrollWidth > clientWidth` cannot see a parent clipping
// text, so labels are measured with a Range; a closed ⋮ panel is scale(0.98) so it is opened and
// confirmed at opacity 1 before any of its rows are trusted.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const cs = (n, p) => (p.startsWith('--') ? getComputedStyle(n).getPropertyValue(p).trim() : getComputedStyle(n)[p]);
    const rect = (n) => { const r = n.getBoundingClientRect(); return { x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
    // Real ink width vs the box it is squeezed into — the only way to see an ellipsis coming.
    const ink = (n) => {
        const rg = document.createRange();
        rg.selectNodeContents(n);
        const box = n.getBoundingClientRect();
        return { text: (n.textContent || '').trim().slice(0, 12), ink: +rg.getBoundingClientRect().width.toFixed(1), box: +box.width.toFixed(1) };
    };
    const rep = { viewport: `${Math.round(innerWidth)}x${Math.round(innerHeight)}`, dpr: +devicePixelRatio.toFixed(3),
        orient: matchMedia('(orientation: landscape)').matches ? '横' : '竖',
        touch: document.documentElement.classList.contains('touch-ui'),
        glass: document.documentElement.classList.contains('glass-lens') ? 'lens' : 'plain',
        rows: [], clipped: [], small: [] };

    if (document.querySelector('.player-area.empty')) {
        const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || ''))) || (v.eventGroups || [])[0];
        await v.playEvent(ev.eventId);
        await sleep(3000);
    }
    const panel = document.getElementById('headerActionsGroup');
    const bar = document.querySelector('.phone-action-bar');
    const sw = document.getElementById('viewSwitcher');
    const section = document.querySelector('.controls-section');
    for (let i = 0; i < 40 && !(sw && rect(sw).w > 0 && rect(section).w > 0); i++) await sleep(300);

    const openPanel = async () => {
        for (let i = 0; i < 25 && +cs(panel, 'opacity') !== 1; i++) {
            if (i % 8 === 0) document.getElementById('tabMoreBtn').click();
            await sleep(250);
        }
        // The entry animation is a transform; measuring during it reads a shrunken panel.
        for (let i = 0; i < 20; i++) {
            const t = cs(panel, 'transform');
            if (/none|matrix\(1, 0, 0, 1, 0, 0\)/.test(t)) break;
            await sleep(100);
        }
        return +cs(panel, 'opacity') === 1;
    };

    const line = (name, n, extra) => { if (n) rep.rows.push(`${name.padEnd(22)} ${JSON.stringify(rect(n))}${extra ? ' ' + extra(n) : ''}`); else rep.rows.push(`${name.padEnd(22)} 不存在`); };

    const panelOpen = await openPanel();
    line('⋮ 面板', panel, (n) => `cols=${getComputedStyle(n).gridTemplateColumns} rows=${getComputedStyle(n).gridTemplateRows}`);
    if (panelOpen) {
        const rows = [...panel.querySelectorAll('.menu-choice, .menu-row, .menu-divider')];
        const heights = {};
        rows.forEach((r) => { const h = +r.getBoundingClientRect().height.toFixed(1); const k = r.className.split(' ')[0]; (heights[k] = heights[k] || new Set()).add(h); });
        rep.panelRows = Object.entries(heights).map(([k, s]) => `${k}=${[...s].sort((a, b) => a - b).join('/')}`).join(' ');
        rep.panelInset = { divider: cs(panel.querySelector('.menu-divider') || panel, '--menu-inset'),
            choice: cs(panel.querySelector('.menu-choice') || panel, '--menu-inset') };
        [...panel.querySelectorAll('.menu-choice')].forEach((row) => {
            row.querySelectorAll('span,a,button,label').forEach((leaf) => {
                const t = ink(leaf);
                if (t.ink > t.box + 0.5) rep.clipped.push(`⋮面板 ${t.text} ink=${t.ink} box=${t.box}`);
            });
        });
    }
    line('底部动作条', bar);
    [...(bar ? bar.querySelectorAll('.tab-btn') : [])].forEach((t) => {
        const l = t.querySelector('.tab-label') || t;
        const k = ink(l);
        rep.rows.push(`  tab ${(t.textContent || '').trim().slice(0, 4).padEnd(4)} ${JSON.stringify(rect(t))} label ink=${k.ink}/box=${k.box}`);
        if (k.ink > k.box + 0.5) rep.clipped.push(`底部条 ${k.text} ink=${k.ink} box=${k.box}`);
    });
    line('控件行', section, (n) => `scroll=${n.scrollWidth} client=${n.clientWidth}`);
    [...(section ? section.querySelectorAll('button') : [])].forEach((b) => {
        const r = rect(b);
        rep.rows.push(`  btn ${(b.id || b.className).slice(0, 18).padEnd(18)} ${r.w}x${r.h} x=${r.x}`);
        if (r.w > 0 && (r.h < 40 || r.w < 40) && getComputedStyle(b).pointerEvents !== 'none') {
            rep.small.push(`${(b.id || b.className).slice(0, 20)} ${r.w}x${r.h}`);
        }
    });
    line('视角切换', sw, (n) => `scroll=${n.scrollWidth} client=${n.clientWidth}`);
    const chips = [...(sw ? sw.querySelectorAll('.view-btn') : [])].map((c) => rect(c).w + 'x' + rect(c).h);
    rep.chips = [...new Set(chips)].join(',');
    line('HUD 卡片', document.querySelector('.metadata-panel'));
    const hero = document.querySelector('.empty-hero');
    if (hero && rect(hero).w > 0) line('找片 hero', hero);
    const exportBtn = document.getElementById('exportPill');
    if (exportBtn && rect(exportBtn).w > 0) line('导出 pill', exportBtn);

    // Anything clickable under 40 CSS px anywhere on the current surface — the number that decides
    // whether the phone's larger viewport actually bought anything.
    const clickables = [...document.querySelectorAll('button:not([disabled]), [role="button"], a[href], input[type="range"]')]
        .filter((n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0; });
    rep.clickables = clickables.length;
    clickables.forEach((n) => {
        const r = rect(n);
        if (r.h < 40 || r.w < 40) rep.small.push(`${(n.id || n.className || n.tagName).toString().slice(0, 26)} ${r.w}x${r.h}`);
    });
    rep.small = [...new Set(rep.small)];
    const glassSel = ['.phone-action-bar', '.metadata-panel', '.card-context-menu', '.header-collapsed .header-actions-group'];
    rep.glassStyles = glassSel.map((s) => {
        const n = document.querySelector(s);
        if (!n) return `${s}=无`;
        const c = getComputedStyle(n);
        return `${s.split(/[\s.]+/).pop()} bf=${(c.backdropFilter || c.webkitBackdropFilter).replace(/url\("[^"]*"\)/g, 'url()').slice(0, 46)} bg=${c.backgroundColor}`;
    });
    return JSON.stringify(rep, null, 1);
})()
