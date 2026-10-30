// R102 pre-flight: 「液态玻璃」在 Android WebView 上能做到哪一步，取决于运行时支持什么，而不是取决于
// 设计稿。这里只问四件事：① `backdrop-filter` 认不认 url() 折射滤镜；② 认不认普通 `filter: url()`
// （SVG 位移图那条路）；③ 当前这几块玻璃到底是哪些参数（照抄进效果图，别凭印象写）；④ 六路播放时
// 叠一层 backdrop-filter 的实测代价（帧时间）。只回布尔/数值/own-class-name，绝不回 URL 或路径。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const sup = (p, v2) => (window.CSS && CSS.supports) ? CSS.supports(p, v2) : 'no-CSS.supports';
    const el = document.getElementById('metadataPanel') || document.querySelector('.metadata-panel');
    const bar = document.querySelector('.phone-action-bar');
    const panel = document.getElementById('headerActionsGroup');
    const grab = (n) => {
        if (!n) return null;
        const cs = getComputedStyle(n);
        return { cls: n.className.split(' ')[0],
            bg: cs.backgroundColor, border: cs.borderColor, radius: cs.borderRadius,
            blur: cs.backdropFilter || cs.webkitBackdropFilter || 'none',
            shadow: (cs.boxShadow || 'none').slice(0, 60) };
    };
    const out = {
        supports: {
            'backdrop-filter: blur(20px)': sup('backdrop-filter', 'blur(20px)'),
            'backdrop-filter: url(#refract)': sup('backdrop-filter', 'url(#refract)'),
            'backdrop-filter: url() blur()': sup('backdrop-filter', 'url(#r) blur(20px)'),
            'filter: url(#refract)': sup('filter', 'url(#refract)'),
            'backdrop-filter: brightness()': sup('backdrop-filter', 'brightness(1.1)'),
            'backdrop-filter: contrast()': sup('backdrop-filter', 'contrast(1.4)'),
            '@supports selector(:has(*))': !!window.CSS && CSS.supports('selector(:has(*))'),
            'transition-behavior: allow-discrete': sup('transition-behavior', 'allow-discrete'),
        },
        chromeUA: (navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1] || '?',
        currentGlass: { card: grab(el), bar: grab(bar), panel: grab(panel) },
        reduceTransparency: (window.prefersReducedTransparency ? prefersReducedTransparency() : 'n/a'),
        highContrast: (window.prefersHighContrast ? prefersHighContrast() : 'n/a'),
    };

    // Cost: measure frame intervals with the glass on, then with backdrop-filter killed on the three
    // surfaces, while six feeds are actually decoding. Δ is what a refraction pass would be spending
    // against — on this chip, in this app, not in a blog post.
    if (!v.currentEvent) {
        const e = (v.eventGroups || []).find(x => !/RecentClips/i.test(String(x.eventId || '')));
        await v.playEvent(e.eventId);
        await sleep(3500);
    }
    const setGrid = () => { document.querySelector('.view-btn[data-view="grid"]')?.click(); };
    setGrid(); await sleep(1200);
    if (!v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.playAll();
    const sample = async (label, ms) => {
        const t = [];
        return await new Promise((res) => {
            const t0 = performance.now(); let last = t0; let n = 0; let sum = 0; let worst = 0;
            const tick = (now) => {
                if (last) { const d = now - last; sum += d; n += 1; if (d > worst) worst = d; }
                last = now;
                if (now - t0 < ms) requestAnimationFrame(tick);
                else res({ label, frames: n, avg: +(sum / Math.max(1, n)).toFixed(2), worst: +worst.toFixed(2) });
            };
            requestAnimationFrame(tick);
        });
    };
    const style = document.createElement('style');
    document.head.appendChild(style);
    out.sixFeedFrames_on = await sample('玻璃开着', 2600);
    style.textContent = '.metadata-panel,.phone-action-bar,.header-collapsed .header-actions-group{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}';
    await sleep(900);
    out.sixFeedFrames_off = await sample('玻璃关掉', 2600);
    style.remove();
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    const a = out.sixFeedFrames_on, b = out.sixFeedFrames_off;
    out.costOfGlassMsPerFrame = +(a.avg - b.avg).toFixed(2);
    out.costOfGlassPct = +(((a.avg - b.avg) / b.avg) * 100).toFixed(1);
    return out;
})()
