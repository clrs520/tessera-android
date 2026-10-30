// R183 · 「29 行仍可点」这一红到底被谁盖住：把面板开起来，逐行滚进可视区，
// 报 elementFromPoint 命中的那个元素（含它的 rect 与 z-index），而不是只报「不匹配」。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const panel = document.querySelector('.header-collapsed .header-actions-group') || document.getElementById('headerActionsGroup');
    if (!document.querySelector('.header-right')?.classList.contains('active')) {
        document.getElementById('tabMoreBtn')?.click();
        await s(700);
    }
    const open = document.querySelector('.header-right')?.classList.contains('active');
    const live = [...panel.querySelectorAll('button, a')]
        .filter(n => getComputedStyle(n).display !== 'none' && !n.disabled);
    const who = (el) => el ? `${el.tagName.toLowerCase()}#${el.id || '-'}.${(typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '-')}` : 'null';
    const rows = [];
    for (const n of live) {
        const pr = panel.getBoundingClientRect();
        const r0 = n.getBoundingClientRect();
        panel.scrollTop += (r0.top - pr.top) - 8;
        await s(0);
        const b = n.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (hit === n || n.contains(hit)) continue;
        const hcs = hit ? getComputedStyle(hit) : null;
        const hr = hit ? hit.getBoundingClientRect() : null;
        rows.push({ row: n.id, rowBox: `${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`,
            hit: who(hit), hitZ: hcs && hcs.zIndex, hitPos: hcs && hcs.position,
            hitBox: hr && `${Math.round(hr.left)},${Math.round(hr.top)} ${Math.round(hr.width)}x${Math.round(hr.height)}`,
            hitOpacity: hcs && hcs.opacity, hitPE: hcs && hcs.pointerEvents });
    }
    const pr = panel.getBoundingClientRect();
    return JSON.stringify({ orient: `${innerWidth}x${innerHeight}`, open, live: live.length,
        dead: rows.length, first: rows.slice(0, 4),
        panelBox: `${Math.round(pr.left)},${Math.round(pr.top)} ${Math.round(pr.height)}h`,
        panelZ: getComputedStyle(panel).zIndex, panelScroll: [Math.round(panel.scrollTop), Math.round(panel.scrollHeight), Math.round(panel.clientHeight)] });
})()
