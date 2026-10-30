// R99 diagnosis, part 2: what the view switcher actually is, why the panel's gap moves between
// states, and what the landscape grid did to the section groups.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const panel = document.getElementById('headerActionsGroup');
    const bar = document.querySelector('.phone-action-bar');
    const cs = (n, p) => getComputedStyle(n).getPropertyValue(p);
    const root = getComputedStyle(document.documentElement);
    const sw = document.getElementById('viewSwitcher');
    const out = {
        state: { collapsed: document.body.classList.contains('sidebar-collapsed'),
            active: document.querySelector('.header-right').classList.contains('active') },
        vars: { actionH: root.getPropertyValue('--action-h'), safeBottom: root.getPropertyValue('--safe-bottom'),
            viewportH: root.getPropertyValue('--viewport-h'), controlsH: root.getPropertyValue('--controls-h') },
        panelBottomCss: cs(panel, 'bottom'),
        panel: panel.getBoundingClientRect().bottom.toFixed(1),
        barTop: bar.getBoundingClientRect().top.toFixed(1),
        barBox: [bar.getBoundingClientRect().top.toFixed(1), bar.getBoundingClientRect().bottom.toFixed(1),
            cs(bar, 'paddingBottom'), cs(bar, 'bottom')],
        switcher: sw ? {
            display: cs(sw, 'display'), w: sw.getBoundingClientRect().width.toFixed(1),
            children: [...sw.children].map(n => ({ cls: n.className, disp: cs(n, 'display'),
                w: +n.getBoundingClientRect().width.toFixed(1), h: +n.getBoundingClientRect().height.toFixed(1),
                txt: (n.textContent || '').trim().slice(0, 10) })),
        } : null,
    };
    // The transport row's two halves, item by item, playing and paused.
    const laneItems = () => [...document.querySelectorAll('.controls-left > *, .controls-right > *, #viewSwitcher')]
        .filter(n => getComputedStyle(n).display !== 'none')
        .map(n => `${n.id || n.className}:${n.getBoundingClientRect().width.toFixed(0)}`);
    out.rowPlaying = laneItems();
    if (v.videoControls.isPlaying) { v.videoControls.togglePlayPause(); await sleep(500); }
    out.rowPaused = laneItems();
    return out;
})()
