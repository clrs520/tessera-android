// R102 · 把「玻璃要多透」这个问题交给测量，而不是交给我的眼睛。
// 对每个主题、每个表面，扫一遍 alpha，报出「最坏帧背景下仍能过 AA 4.5:1 的最小 alpha」。
// 主题必须走 APP 自己的开关（setThemeChoice）—— 上一版探针只摘 body.dark-theme，结果 fill 换了
// 文字色没换，量出 1.08:1 这种荒谬数字，那是量具坏了不是设计坏了。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v.currentEvent) {
        const e = (v.eventGroups || []).find(x => !/RecentClips/i.test(String(x.eventId || '')));
        await v.playEvent(e.eventId); await sleep(3000);
    }
    document.querySelector('.view-btn[data-view="grid"]')?.click();
    await sleep(1200);
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    const relLum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const x = relLum(...a), y = relLum(...b);
        return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
    const parse = s => (s.match(/[\d.]+/g) || []).map(Number);
    const frameExtremes = () => {
        const vid = document.querySelector('#front-container video');
        if (!vid || !vid.videoWidth) return null;
        const cv = document.createElement('canvas');
        cv.width = 220; cv.height = 124;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(vid, 0, 0, cv.width, cv.height);
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        let bright = [0, 0, 0], bl = -1, dark = [255, 255, 255], dl = 999;
        for (let i = 0; i < d.length; i += 4) {
            const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (l > bl) { bl = l; bright = [d[i], d[i + 1], d[i + 2]]; }
            if (l < dl) { dl = l; dark = [d[i], d[i + 1], d[i + 2]]; }
        }
        return { bright, dark, bl, dl };
    };
    const SURF = [
        ['底部条', '.phone-action-bar', '.tab-label', '--lens-fill'],
        ['⋮ 面板', '.header-collapsed .header-actions-group', '.btn-text', '--lens-fill'],
        ['卡片', '.metadata-panel', '.metadata-primary', null],
    ];
    const solve = (px) => SURF.map(([name, sel, textSel, varName]) => {
        document.querySelector('.header-right')?.classList.add('active');
        const n = document.querySelector(sel);
        const out = { surface: name };
        if (!n) { document.querySelector('.header-right')?.classList.remove('active'); return { surface: name, note: 'missing' }; }
        const tn = n.querySelector(textSel) || n;
        const tc = parse(getComputedStyle(tn).color).slice(0, 3);
        const base = parse(getComputedStyle(n).backgroundColor);
        const bg = relLum(...tc) > 0.18 ? px.bright : px.dark;
        out.text = getComputedStyle(tn).color;
        out.bgUsed = bg.join(',');
        out.currentAlpha = base.length > 3 ? base[3] : 1;
        out.currentCr = ratio([0, 1, 2].map(k => base[k] * out.currentAlpha + bg[k] * (1 - out.currentAlpha)), tc);
        let best = null;
        for (let a = 0.30; a <= 0.96; a += 0.01) {
            const cr = ratio([0, 1, 2].map(k => base[k] * a + bg[k] * (1 - a)), tc);
            if (cr >= 4.5) { best = +a.toFixed(2); break; }
        }
        out.minAlphaForAA = best;
        document.querySelector('.header-right')?.classList.remove('active');
        return out;
    });
    const startTheme = v.themeMode ? v.themeMode() : 'auto';
    const px = frameExtremes();
    v.setThemeChoice('dark'); await sleep(700);
    const dark = solve(px);
    v.setThemeChoice('light'); await sleep(700);
    const light = solve(px);
    v.setThemeChoice(startTheme === 'auto' ? 'auto' : startTheme); await sleep(600);
    return JSON.stringify({ frame: { bright: px?.bright.join(','), dark: px?.dark.join(',') }, dark, light }, null, 1);
})()
