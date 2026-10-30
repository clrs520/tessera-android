// R101-3 precheck 2: the injected-rule sweep reported no overlap anywhere, while the r100 suite's
// own baseline measured 9.6 px on 单路 and 16.3 px on 大小窗. Same selector, different answer — so
// say what the card actually is right now: its classes, whether it is visible, and its rect.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const setView = name => document.querySelector(`.view-btn[data-view="${name}"]`)?.click();
    const one = async (name) => {
        setView(name); await sleep(900);
        const byId = document.getElementById('metadataPanel');
        const byClass = document.querySelector('.metadata-panel');
        const box = n => { if (!n) return null; const b = n.getBoundingClientRect(); const cs = getComputedStyle(n);
            return { top: +b.top.toFixed(1), bottom: +b.bottom.toFixed(1), h: +b.height.toFixed(1),
                left: +b.left.toFixed(1), right: +b.right.toFixed(1), opacity: cs.opacity,
                display: cs.display, transform: cs.transform === 'none' ? 'none' : 'shifted',
                classes: n.className }; };
        const cell = document.querySelector('.video-container:not(.hidden)');
        const vid = cell && cell.querySelector('video');
        let p = null;
        if (vid && vid.videoWidth) {
            const b = cell.getBoundingClientRect();
            const s = Math.min(b.width / vid.videoWidth, b.height / vid.videoHeight);
            const h = vid.videoHeight * s;
            p = { top: +(b.top + (b.height - h) / 2).toFixed(1), bottom: +(b.top + (b.height + h) / 2).toFixed(1) };
        }
        return { view: name, byId: box(byId), byClass: box(byClass), frame: p,
            sameNode: byId === byClass, foldState: v?.metadataOverlay?.isFolded ?? null,
            hudH: getComputedStyle(document.documentElement).getPropertyValue('--hud-h').trim(),
            metaBottom: getComputedStyle(document.documentElement).getPropertyValue('--meta-bottom').trim() };
    };
    if (v.videoControls.clipModeActive) { v.videoControls.toggleClipMode(); await sleep(900); }
    return { orient: `${innerWidth}x${innerHeight}`, shots: [await one('front'), await one('legacy')] };
})()
