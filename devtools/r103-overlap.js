// R103 · How much real picture is actually behind each glass surface?
// Blur and refraction only read when there is content behind the panel, so before arguing about
// alpha, measure the overlap between each lens surface and the painted video rect per view.
(function () {
    const SURF = {
        底部条: '.phone-action-bar',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        行车数据卡片: '.metadata-panel',
        找片hero: '.player-area.empty .empty-hero',
        长按菜单: '.card-context-menu',
    };
    const painted = (video, cell) => {
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        const b = cell.getBoundingClientRect();
        const s = Math.min(b.width / video.videoWidth, b.height / video.videoHeight);
        const h = video.videoHeight * s, w = video.videoWidth * s;
        return { top: b.top + (b.height - h) / 2, bottom: b.top + (b.height + h) / 2,
            left: b.left + (b.width - w) / 2, right: b.left + (b.width + w) / 2 };
    };
    const rects = [...document.querySelectorAll('.video-container')]
        .filter((x) => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'))
        .map((x) => painted(x.querySelector('video'), x)).filter(Boolean);
    const out = { view: (document.querySelector('[data-view].active') || {}).dataset?.view || '?',
        css: `${innerWidth}x${innerHeight}@${devicePixelRatio}`, pictureRects: rects.length, surfaces: {} };
    for (const [name, sel] of Object.entries(SURF)) {
        const el = document.querySelector(sel);
        if (!el) { out.surfaces[name] = 'absent'; continue; }
        const s = getComputedStyle(el);
        if (s.display === 'none' || +s.opacity === 0) { out.surfaces[name] = 'hidden'; continue; }
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        let cov = 0;
        for (const p of rects) {
            const y = Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top);
            const w = Math.min(r.right, p.right) - Math.max(r.left, p.left);
            if (y > 0 && w > 0) cov += y * w;
        }
        out.surfaces[name] = { box: `${Math.round(r.width)}x${Math.round(r.height)}`,
            pctOverPicture: area ? +(100 * Math.min(cov, area) / area).toFixed(1) : 0 };
    }
    return JSON.stringify(out);
})()
