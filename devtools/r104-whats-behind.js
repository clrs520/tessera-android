// R104 · What is actually behind each glass surface, per view, with the overlays OPEN?
// Answers "玻璃背后有哪些内容 / 值不值得折射": for every lens surface, report the picture overlap
// and the local contrast of what is behind it. A lens over flat black bends nothing, so the honest
// cost/benefit needs this table, not an opinion.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
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
    // Sample what the compositor would show behind the surface: the video frame where it overlaps,
    // otherwise the CSS paint chain. Report mean + spread, because "有内容" means local contrast.
    const canvas = document.createElement('canvas');
    canvas.width = 20; canvas.height = 14;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const behind = (el) => {
        const r = el.getBoundingClientRect();
        let best = null;
        for (const p of picRects()) {
            const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
            const w = Math.min(r.right, p.right) - Math.max(r.left, p.left);
            if (y <= 0 || w <= 0) continue;
            const cov = (y * w) / (r.width * r.height);
            if (!best || cov > best.cov) best = { cov };
        }
        const pct = best ? +(100 * Math.min(1, best.cov)).toFixed(1) : 0;
        // spread of the frame under it (only meaningful where there IS a frame)
        let spread = null;
        if (pct > 0) {
            for (const x of [...document.querySelectorAll('.video-container')]) {
                const vid = x.querySelector('video');
                const p = painted(vid, x);
                if (!p || vid.readyState < 2) continue;
                const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
                if (y <= 0) continue;
                try {
                    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    const L = [];
                    for (let i = 0; i < d.length; i += 4) L.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
                    const mean = L.reduce((a, b) => a + b, 0) / L.length;
                    spread = Math.round(Math.sqrt(L.reduce((a, b) => a + (b - mean) ** 2, 0) / L.length));
                } catch (e) { /* no texture yet */ }
                break;
            }
        }
        return { pctOverPicture: pct, frameStdDev: spread };
    };
    const SURF = {
        底部条: '.phone-action-bar',
        行车数据卡片: '.metadata-panel',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        长按菜单: '.card-context-menu',
    };
    const openPanel = async () => {
        const p = document.querySelector('.header-collapsed .header-actions-group');
        for (let i = 0; i < 12 && getComputedStyle(p).visibility !== 'visible'; i++) {
            document.getElementById('tabMoreBtn').click(); await sleep(250);
        }
        await sleep(400);
        return getComputedStyle(p).visibility === 'visible';
    };
    const closePanel = async () => {
        const p = document.querySelector('.header-collapsed .header-actions-group');
        if (getComputedStyle(p).visibility === 'visible') { document.getElementById('tabMoreBtn').click(); await sleep(400); }
    };
    const table = [];
    for (const view of ['grid', 'legacy', 'front']) {
        document.querySelector(`[data-view="${view}"]`)?.click();
        await sleep(900);
        const panelOpened = await openPanel();
        for (const [name, sel] of Object.entries(SURF)) {
            const el = document.querySelector(sel);
            if (!el) { table.push({ view, name, state: 'absent' }); continue; }
            const cs = getComputedStyle(el);
            if (cs.visibility !== 'visible' || +cs.opacity === 0) { table.push({ view, name, state: 'closed' }); continue; }
            const r = el.getBoundingClientRect();
            table.push(Object.assign({ view, name, box: `${Math.round(r.width)}x${Math.round(r.height)}` }, behind(el), { state: 'open' }));
        }
        await closePanel();
    }
    document.querySelector('[data-view="grid"]')?.click();
    return JSON.stringify({ css: `${innerWidth}x${innerHeight}@${devicePixelRatio}`, table }, null, 1);
})()
