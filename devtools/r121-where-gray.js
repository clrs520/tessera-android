// R121 · 谁在用那支次要灰 —— 逐个元素列出来，并标出它**自己有没有底色**。
//
// 为什么要分「自己有没有底色」：求解器与 subAa 都只读 `color`，但「白字压在紫色药丸上」那支白
// 从来不是压在玻璃上的 —— 把它算进「此刻几支字不过 AA」是假阳性（1.2.202 真机报的
// `subAa=3/worst=1.04` 里就有它）。这一份把两件事一次量清：① 要改的灰落在哪些选择器上；
// ② 现在报的 subAa 有几支是假阳性。
(() => {
    const TARGET = 'rgb(108, 117, 125)';
    const tag = (el) => el.id ? `#${el.id}` : `.${String(el.className || '').trim().split(/\s+/)[0] || el.tagName.toLowerCase()}`;
    const hit = [];
    const onGlassOnly = [];
    for (const sel of LENS_SURFACES) {
        const host = document.querySelector(sel);
        if (!host) continue;
        for (const n of [host, ...host.querySelectorAll('*')]) {
            if (!n.textContent || !n.textContent.trim()) continue;
            const cs = getComputedStyle(n);
            if (cs.color !== TARGET) continue;
            const own = parseInk(cs.backgroundColor);
            const ownA = (cs.backgroundColor.match(/rgba?\(([^)]+)\)/) || [, '1'])[1].split(',')[3];
            hit.push({
                surface: SURFACE_TAGS[sel] || sel,
                path: `${tag(n.parentElement || n)} > ${tag(n)}`,
                text: n.textContent.trim().slice(0, 12),
                size: cs.fontSize, weight: cs.fontWeight,
                ownBg: cs.backgroundColor,
                paintsOnGlass: !(ownA !== undefined && parseFloat(ownA) > 0.5),
            });
        }
    }
    // 顺带把「非玻璃面」上用同一支灰的地方也数出来 —— B 说好了只改压在玻璃上的，别越界。
    const elsewhere = new Map();
    for (const n of document.querySelectorAll('body *')) {
        if (!n.textContent || !n.textContent.trim()) continue;
        const cs = getComputedStyle(n);
        if (cs.color !== TARGET) continue;
        if (LENS_SURFACES.some((s) => (document.querySelector(s) || { contains: () => false }).contains(n))) continue;
        const k = tag(n);
        elsewhere.set(k, (elsewhere.get(k) || 0) + 1);
    }
    return {
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        onLensSurfaces: hit,
        elsewhereCount: [...elsewhere.values()].reduce((a, b) => a + b, 0),
        elsewhereTop: [...elsewhere.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
})()
