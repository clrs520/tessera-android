// R181 · 面板静置 400ms 后再读一次行命中：区分"真盖住"与"动画里量坐标"。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const panel = document.querySelector('.header-actions-group');
    if (!panel) return JSON.stringify({ err: 'no panel' });
    const p0 = panel.getBoundingClientRect();
    await sleep(400);
    const p1 = panel.getBoundingClientRect();
    const out = [];
    for (const id of ['metaSwitchBtn', 'aboutBtn', 'langToggleBtn', 'gestureHelpBtn',
        'diagnosticsBtn', 'menuFolderBtn', 'loopABBtn']) {
        const n = document.getElementById(id);
        if (!n) { out.push(id + ':absent'); continue; }
        const b = n.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        const good = hit === n || n.contains(hit);
        const h = hit ? (hit.id || String(hit.className || hit.tagName).slice(0, 24)) : 'null';
        out.push(`${id}@${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)} ${good ? 'HIT' : 'DEAD→' + h}`);
    }
    return JSON.stringify({
        settled: Math.abs(p0.top - p1.top) < 0.5 && Math.abs(p0.left - p1.left) < 0.5,
        panel: `${Math.round(p0.left)},${Math.round(p0.top)} ${Math.round(p0.width)}x${Math.round(p0.height)}`,
        scrollTop: panel.scrollTop, scrollH: panel.scrollHeight, clientH: panel.clientHeight,
        csTransform: getComputedStyle(panel).transform, csTransition: getComputedStyle(panel).transition.slice(0, 60),
        out,
    });
})()
