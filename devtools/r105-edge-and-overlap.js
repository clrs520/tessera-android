// R105 · Phase 1 for two questions at once.
//  (a) Why does the TOP line read thicker than the other three? Read the border per side AND every
//      inset shadow with its offset/blur, then compute how many light pixels stack on each edge.
//  (b) Which lens surfaces actually sit on real picture — in PORTRAIT and in LANDSCAPE, because the
//      data card is draggable over the video sideways and a portrait-only answer would be wrong.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const SURF = {
        底部条: '.phone-action-bar',
        行车数据卡片: '.metadata-panel',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        长按菜单: '.card-context-menu',
        找片hero: '.player-area.empty .empty-hero',
    };
    const painted = (video, cell) => {
        if (!video || !video.videoWidth) return null;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const h = video.videoHeight * s, w = video.videoWidth * s;
        return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
            left: b.left + (b.width - w) / 2, right: b.left + (b.width + w) / 2 };
    };
    const picRects = () => [...document.querySelectorAll('.video-container')]
        .filter((x) => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'))
        .map((x) => painted(x.querySelector('video'), x)).filter(Boolean);
    const parseShadow = (sh) => (sh || '').split(/,(?![^(]*\))/).map((p) => {
        const nums = (p.match(/-?[\d.]+px/g) || []).map(parseFloat);
        const col = (p.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/i) || [''])[0];
        return { inset: /inset/.test(p), x: nums[0] ?? 0, y: nums[1] ?? 0, blur: nums[2] ?? 0, spread: nums[3] ?? 0,
            light: (() => { const m = col.match(/[\d.]+/g); if (!m) return null;
                const a = m.length > 3 ? +m[3] : 1; return a * (0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2]) / 255; })() };
    });
    const edgeStack = (el) => {
        const cs = getComputedStyle(el);
        const sides = { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' };
        const out = {};
        const shadows = parseShadow(cs.boxShadow);
        for (const [k, side] of Object.entries(sides)) {
            const bw = parseFloat(cs['border' + k + 'Width']) || 0;
            const bc = cs['border' + k + 'Color'];
            const bm = bc.match(/[\d.]+/g) || [];
            const bAlpha = bm.length > 3 ? +bm[3] : (bm.length === 3 ? 1 : 0);
            const bLum = bm.length >= 3 ? (0.299 * +bm[0] + 0.587 * +bm[1] + 0.114 * +bm[2]) / 255 : 0;
            const borderLight = bAlpha * bLum;
            // which insets land on this edge, and are they sharp (blur 0) or soft?
            const onEdge = shadows.filter((s) => s.inset && (
                (side === 'top' && s.y > 0) || (side === 'bottom' && s.y < 0)
                || (side === 'left' && s.x > 0) || (side === 'right' && s.x < 0)));
            const sharp = onEdge.filter((s) => s.blur <= 1.5);
            out[k] = { borderPx: +bw.toFixed(2), borderLight: +borderLight.toFixed(3),
                sharpInsets: sharp.length, softInsets: onEdge.length - sharp.length,
                // the thing the eye reads as "line weight": stacked light 1px bands
                lightLines: (borderLight > 0.05 ? 1 : 0) + sharp.filter((s) => (s.light ?? 1) > 0.05).length };
        }
        return out;
    };
    const openPanel = async () => {
        const p = document.querySelector('.header-collapsed .header-actions-group');
        for (let i = 0; i < 14 && getComputedStyle(p).visibility !== 'visible'; i++) {
            document.getElementById('tabMoreBtn').click(); await sleep(250);
        }
        await sleep(350);
    };
    const closePanel = async () => {
        const p = document.querySelector('.header-collapsed .header-actions-group');
        if (getComputedStyle(p).visibility === 'visible') { document.getElementById('tabMoreBtn').click(); await sleep(350); }
    };
    const overlap = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return null;
        let cov = 0;
        for (const p of picRects()) {
            const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
            const w = Math.min(r.right, p.right) - Math.max(r.left, p.left);
            if (y > 0 && w > 0) cov += y * w;
        }
        return +(100 * Math.min(1, cov / (r.width * r.height))).toFixed(1);
    };
    const rows = [];
    for (const view of ['grid', 'front']) {
        document.querySelector(`[data-view="${view}"]`)?.click();
        await sleep(800);
        await openPanel();
        for (const [name, sel] of Object.entries(SURF)) {
            const el = document.querySelector(sel);
            if (!el) { rows.push({ view, name, state: 'absent' }); continue; }
            const cs = getComputedStyle(el);
            if (cs.visibility !== 'visible' || +cs.opacity === 0) { rows.push({ view, name, state: 'closed' }); continue; }
            const st = edgeStack(el);
            rows.push({ view, name, state: 'open', overPicturePct: overlap(el),
                lines: ['Top', 'Right', 'Bottom', 'Left'].map((k) => `${k[0]}:${st[k].lightLines}`).join(' '),
                detail: st });
        }
        await closePanel();
    }
    return JSON.stringify({ orient: innerWidth > innerHeight ? 'landscape' : 'portrait',
        css: `${innerWidth}x${innerHeight}@${devicePixelRatio.toFixed(2)}`, rows }, null, 1);
})()
