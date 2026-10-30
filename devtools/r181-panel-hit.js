// R181 · 横屏 ⋮ 面板的行点不到：到底是"谁"盖在上面。
// 只回元素身份/类名/尺寸，不回路径、不回 token。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const panel = document.querySelector('.header-collapsed .header-actions-group')
        || document.getElementById('headerActionsGroup');
    if (!panel) return JSON.stringify({ err: 'panel missing' });
    // 用用户的路打开 ⋮ 面板
    const three = document.getElementById('headerMenuBtn') || document.querySelector('.header-menu-btn');
    if (three && !panel.classList.contains('show')) three.click();
    for (let i = 0; i < 8 && !(panel.offsetHeight > 0); i += 1) { await sleep(150); }
    const who = (n) => n ? (n.id || (n.className && String(n.className).slice(0, 40)) || n.tagName) : null;
    const pr = panel.getBoundingClientRect();
    const live = [...panel.querySelectorAll('button, a')]
        .filter(n => getComputedStyle(n).display !== 'none' && !n.disabled);
    const rows = [];
    for (const n of live.slice(0, 8)) {
        const r0 = n.getBoundingClientRect();
        panel.scrollTop += (r0.top - pr.top) - 8;
        await sleep(60);
        const b = n.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        const stack = (document.elementsFromPoint(cx, cy) || []).slice(0, 4).map(who);
        rows.push({
            id: n.id || '(icon)',
            ok: hit === n || n.contains(hit),
            hit: who(hit),
            stack,
            inPanel: panel.contains(hit),
            rect: `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`,
            z: getComputedStyle(n.closest('[class]') || n).zIndex,
        });
    }
    panel.scrollTop = 0;
    const card = document.getElementById('metadataPanel');
    const cr = card ? card.getBoundingClientRect() : null;
    return JSON.stringify({
        orient: `${innerWidth}x${innerHeight}`,
        panelRect: `${Math.round(pr.left)},${Math.round(pr.top)} ${Math.round(pr.width)}x${Math.round(pr.height)}`,
        panelZ: getComputedStyle(panel).zIndex,
        panelClasses: String(panel.className).slice(0, 60),
        liveCount: live.length,
        card: cr ? {
            rect: `${Math.round(cr.left)},${Math.round(cr.top)} ${Math.round(cr.width)}x${Math.round(cr.height)}`,
            z: getComputedStyle(card).zIndex,
            display: getComputedStyle(card).display,
            cls: String(card.className).slice(0, 60),
            pe: getComputedStyle(card).pointerEvents,
            overlap: Math.max(0, Math.min(cr.right, pr.right) - Math.max(cr.left, pr.left))
                * Math.max(0, Math.min(cr.bottom, pr.bottom) - Math.max(cr.top, pr.top)) > 0,
        } : null,
        dim: (() => { const d = document.getElementById('phoneBrightnessDim'); return d ? getComputedStyle(d).opacity : null; })(),
        rows,
    });
})()
