// R102 contrast probe: the lens makes the fill thinner, so "is the text still readable" stops being
// a constant and starts depending on how bright the frame behind it is. Measure the worst case in
// BOTH themes by taking the brightest pixel of the live frame, compositing it under each surface's
// own fill, and comparing against the colour the text actually paints with.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v.currentEvent) {
        const e = (v.eventGroups || []).find(x => !/RecentClips/i.test(String(x.eventId || '')));
        await v.playEvent(e.eventId);
        await sleep(3000);
    }
    document.querySelector('.view-btn[data-view="grid"]')?.click();
    await sleep(1200);
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    const relLum = (r, g, b) => {
        const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => { const x = relLum(...a), y = relLum(...b);
        return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
    const parse = s => (s.match(/[\d.]+/g) || []).map(Number);
    const brightest = () => {
        const vid = document.querySelector('#front-container video');
        if (!vid || !vid.videoWidth) return null;
        const cv = document.createElement('canvas');
        cv.width = 200; cv.height = 112;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(vid, 0, 0, cv.width, cv.height);
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let best = [0, 0, 0], bl = -1, dark = [255, 255, 255], dl = 999;
        for (let i = 0; i < d.length; i += 4) {
            const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (l > bl) { bl = l; best = [d[i], d[i + 1], d[i + 2]]; }
            if (l < dl) { dl = l; dark = [d[i], d[i + 1], d[i + 2]]; }
        }
        return { bright: best, dark };
    };
    const SURF = [
        ['底部条文字', '.phone-action-bar', '.tab-label'],
        ['⋮ 面板行', '.header-collapsed .header-actions-group', '.btn-text'],
        ['卡片读数', '.metadata-panel', '.metadata-primary'],
    ];
    const run = (theme) => {
        const px = brightest();
        if (!px) return [{ surface: '-', cr: 0, note: 'no frame' }];
        return SURF.map(([name, sel, textSel]) => {
            document.querySelector('.header-right')?.classList.add('active');
            const n = document.querySelector(sel);
            if (!n) return { surface: name, cr: 0, note: 'surface missing' };
            const cs = getComputedStyle(n);
            const tn = n.querySelector(textSel) || n;
            const tc = parse(getComputedStyle(tn).color).slice(0, 3);
            const fill = parse(cs.backgroundColor);
            const a = fill.length > 3 ? fill[3] : 1;
            // Worst case for light text is the brightest thing behind it, and vice versa.
            const bg = relLum(...tc) > 0.18 ? px.bright : px.dark;
            const comp = [0, 1, 2].map(k => fill[k] * a + bg[k] * (1 - a));
            const cr = ratio(comp, tc);
            document.querySelector('.header-right')?.classList.remove('active');
            return { surface: name, cr, fill: cs.backgroundColor, text: getComputedStyle(tn).color,
                filter: (cs.backdropFilter || '').replace(/url\(["']?[^"')]*["']?\)/, 'url()').slice(0, 52) };
        });
    };
    const wasDark = document.body.classList.contains('dark-theme');
    const dark = run('dark');
    document.body.classList.remove('dark-theme');
    await sleep(400);
    const light = run('light');
    if (wasDark) document.body.classList.add('dark-theme');
    await sleep(300);
    return JSON.stringify({ theme: wasDark ? 'dark' : 'light', dark, light,
        fails: [...dark, ...light].filter(r => r.cr && r.cr < 4.5).map(r => `${r.surface} ${r.cr}`) }, null, 1);
})()
