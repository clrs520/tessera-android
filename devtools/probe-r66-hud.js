// R66 reader: what the landscape 行车数据 HUD actually is right now — folded or not, where it sits,
// what the pill kept visible, and what the viewer's own record says. Run with devtools/cdp-eval.mjs.
(() => {
    const mm = window.viewer && window.viewer.metadataManager;
    if (!mm) return 'NO VIEWER — the app is not up or a top-level throw killed the script';
    const el = mm.dom.panel;
    const q = s => document.querySelector(s);
    const box = n => {
        if (!n) return 'missing';
        const b = n.getBoundingClientRect();
        return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)];
    };
    const shown = s => {
        const n = q(s);
        if (!n) return 'missing';
        const b = n.getBoundingClientRect();
        return b.width > 1 && b.height > 1 ? 'shown' : 'hidden';
    };
    const r = el.getBoundingClientRect();
    const area = mm.dom.playerArea.getBoundingClientRect();
    return JSON.stringify({
        touchUi: document.documentElement.classList.contains('touch-ui'),
        landscape: matchMedia('(orientation: landscape)').matches,
        css: [Math.round(innerWidth), Math.round(innerHeight)],
        available: mm.hudFoldAvailable(),
        numbers: mm.hudHasNumbers(),
        collapsed: el.classList.contains('collapsed'),
        folded: el.classList.contains('hud-folded'),
        moved: el.classList.contains('is-moved'),
        inline: [el.style.left || '-', el.style.top || '-'],
        panel: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
        area: [Math.round(area.left), Math.round(area.top), Math.round(area.width), Math.round(area.height)],
        foldBtn: box(mm.dom.hudFoldBtn),
        foldLabel: mm.dom.hudFoldBtn && mm.dom.hudFoldBtn.getAttribute('aria-label'),
        gear: shown('#metaGear'),
        speed: shown('#metaSpeed'),
        brake: shown('.meta-brake-container'),
        blinkerL: shown('#metaBlinkerLeft'),
        rightCol: shown('.meta-right-col'),
        secondary: shown('.metadata-secondary'),
        touchAction: getComputedStyle(el).touchAction,
        stored: localStorage.getItem('tdashcam.metaHud'),
        layout: window.viewer.multiCameraPlayer.layoutMode,
        speedText: q('#metaSpeed') && q('#metaSpeed').textContent,
        gearText: q('#metaGear') && q('#metaGear').textContent
    }, null, 1);
})()
