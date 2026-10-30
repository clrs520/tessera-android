// R120 · 「谁把白玻璃钉成白板」——逐面逐墨的厚度需求表。
//
// 真机 1.2.201 的 alphaLog：want 在 .45 与 .9/.92 之间随画面亮度来回跳
// （lum=167 → want .9，lum=197 → want .92，lum=121 → want .45），而浅色主题的
// 白玻璃要 .9 就是一块白板。这一份不猜是哪支墨：把 `adaptGlassAlpha` 收集墨色的
// 那段原样搬过来，逐条墨单独求「它自己需要的最小 alpha」，按底色分档列出来。
//
// 底色不能只测当前那一帧 —— AVD 的画面和小米 14 那条录像不是一回事，所以直接拿
// 真机读出来的那几个 luma（100/134/167/197/255）当自变量，一次算完。
// 两个主题各量一遍：同一支 token 在深浅两头的色值不同，钉厚的那一支也不同。
(() => {
    const LUMS = [100, 134, 167, 197, 255];
    const composite = (fill, bd, a) => [0, 1, 2].map((k) => fill[k] * a + bd[k] * (1 - a));
    const cr = (fill, bd, ink, a) => contrastRatio(composite(fill, bd, a), ink);
    // 单条墨自己的需求：24 档线性扫（和 solveGlassAlpha 同一套，不假设单调）。
    const demand = (fill, bd, ink) => {
        for (let i = 0; i <= 24; i += 1) {
            const a = GLASS_ALPHA_MIN + (GLASS_ALPHA_MAX - GLASS_ALPHA_MIN) * (i / 24);
            if (cr(fill, bd, ink, a) >= 4.5) return +a.toFixed(3);
        }
        return null; // 这一端扫不到：要么两头都不过（救不了），要么只有薄那头过
    };
    const measure = () => {
        const out = { live: {}, surfaces: [] };
        out.live = {
            alpha: +glassState.alpha.toFixed(3), want: +glassState.target.toFixed(3),
            plate: +glassState.plateAlpha.toFixed(3), plateWant: +glassState.plateTarget.toFixed(3),
            luma: glassState.luma, src: glassState.src, inkTypes: glassState.inks,
            unsavable: glassState.unsavable, lensOn: glassState.lensLive,
            fill: getComputedStyle(document.querySelector('.phone-action-bar')).backgroundColor,
        };
        for (const sel of LENS_SURFACES) {
            const el = document.querySelector(sel);
            if (!el) { out.surfaces.push({ sel, missing: true }); continue; }
            const cs = getComputedStyle(el);
            const fill = parseInk(cs.backgroundColor);
            if (fill.length !== 3) { out.surfaces.push({ sel, badFill: cs.backgroundColor }); continue; }
            const inkSet = new Set();
            const who = new Map();
            for (const n of [el, ...el.querySelectorAll('span, a, button, label, .btn-text, .menu-divider, .tab-label, .meta-value')]) {
                if (!n.textContent || !n.textContent.trim()) continue;
                const c = parseInk(getComputedStyle(n).color);
                if (c.length !== 3) continue;
                const key = c.join(',');
                inkSet.add(key);
                if (!who.has(key)) who.set(key, (n.className || n.tagName) + ' «' + n.textContent.trim().slice(0, 12) + '»');
                if (inkSet.size >= 12) break;
            }
            const inks = [...inkSet].map((s) => s.split(',').map(Number));
            const rows = inks.map((ink) => {
                const per = {};
                for (const L of LUMS) {
                    const bd = [L, L, L];
                    const d = demand(fill, bd, ink);
                    per[L] = d === null
                        ? (cr(fill, bd, ink, GLASS_ALPHA_MIN) >= 4.5 ? 'thin-ok' : 'unsavable')
                        : d;
                }
                return { ink: `rgb(${ink.join(',')})`, seenOn: who.get(ink.join(',')), per };
            });
            // 这一面在这一拍的实际需求 = helpable 那些的最大值（和 need[group] 同算法）
            const actual = {};
            for (const L of LUMS) {
                const bd = [L, L, L];
                actual[L] = +solveGlassAlpha(fill, bd, inks).toFixed(3);
            }
            out.surfaces.push({
                sel, group: sel === GLASS_PLATE_SURFACE ? 'plate' : 'glass',
                fill: cs.backgroundColor, lensOn: el.classList.contains('lens-on'),
                inkCount: inks.length, rows, needAt: actual,
            });
        }
        return out;
    };
    const wasDark = document.body.classList.contains('dark-theme');
    const result = { dark: null, light: null };
    result[wasDark ? 'dark' : 'light'] = measure();
    document.body.classList.toggle('dark-theme');
    try { result[wasDark ? 'light' : 'dark'] = measure(); }
    finally { document.body.classList.toggle('dark-theme'); }
    return result;
})()
