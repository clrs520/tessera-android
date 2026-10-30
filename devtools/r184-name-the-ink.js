// R184 · 真机报 `subAa=1/worst=1.71` 但没说哪一支墨、在哪一面。这一支不修任何东西，
// 只把求解器那套循环原样复算一遍并**点名**：面 → 元素 → 墨色 → 实际渲出来的对比度。
// 复算必须用产品自己的量（glassState.luma / 各面自己那组 alpha / paintsOnGlass 的同一判据），
// 否则报出来的是一支屏幕上根本不存在的组合。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const bd = [glassState.luma, glassState.luma, glassState.luma];
    const own = (n) => [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('').trim();
    const paintsOnGlass = (n, host, fill) => {
        for (let p = n; p && p !== host; p = p.parentElement) {
            const bg = getComputedStyle(p).backgroundColor;
            const v = parseInk(bg);
            if (v.length !== 3) continue;
            const m = bg.match(/rgba\([^()]*,\s*([\d.]+)\s*\)/);
            const a = m ? parseFloat(m[1]) : 1;
            if (a > 0.5 && v.some((x, i) => Math.abs(x - fill[i]) > 12)) return false;
        }
        return true;
    };
    // 这支墨在「这一面 + 这一帧」上，最厚能到多少？扫到 GLASS_ALPHA_MAX 都不过 4.5 就是救不了。
    const best = (fill, ink) => {
        let top = 0;
        for (let i = 0; i <= 24; i += 1) {
            const a = GLASS_ALPHA_MIN + (GLASS_ALPHA_MAX - GLASS_ALPHA_MIN) * (i / 24);
            const c = contrastRatio([0, 1, 2].map((k) => fill[k] * a + bd[k] * (1 - a)), ink);
            if (c > top) top = c;
        }
        return top;
    };
    const rows = [];
    for (const sel of LENS_SURFACES) {
        const el = document.querySelector(sel);
        if (!el) { rows.push({ sel, absent: true }); continue; }
        const cs = getComputedStyle(el);
        const fill = parseInk(cs.backgroundColor);
        if (fill.length !== 3) continue;
        const isPlate = sel === GLASS_PLATE_SURFACE;
        const a = isPlate ? glassState.plateAlpha : glassState.alpha;
        const seen = new Set();
        for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
            if (!n.textContent || !n.textContent.trim()) continue;
            const st = getComputedStyle(n);
            const ink = parseInk(st.color);
            if (ink.length !== 3) continue;
            const key = ink.join(',');
            if (seen.has(key)) continue;
            if (!paintsOnGlass(n, el, fill)) continue;      // 压在自己药丸上的白字不算对着玻璃读
            const comp = [0, 1, 2].map((k) => fill[k] * a + bd[k] * (1 - a));
            const cr = contrastRatio(comp, ink);
            if (cr >= 4.5) continue;
            seen.add(key);
            rows.push({ sel, tag: SURFACE_TAGS[sel] || sel, group: isPlate ? 'plate' : 'glass', a: +a.toFixed(3),
                ink: key, cr: +cr.toFixed(2), bestByAlpha: +best(fill, ink).toFixed(2),
                el: `${n.tagName.toLowerCase()}.${(typeof n.className === 'string' ? n.className.trim().split(/\s+/)[0] : '-')}`,
                text: (own(n) || n.textContent.trim()).slice(0, 14),
                fs: st.fontSize, fw: st.fontWeight, vis: n.getBoundingClientRect().height > 0 });
        }
    }
    return JSON.stringify({ luma: glassState.luma, src: glassState.src, alpha: glassState.alpha,
        plateAlpha: glassState.plateAlpha, reported: { subAa: glassState.subAa, worst: glassState.subAaWorst,
            unsavable: glassState.unsavable, binding: glassState.binding }, offenders: rows });
})()
