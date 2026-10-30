// R103 · Why does --lens-alpha stay at .920 on the find page?
// Probe the early-return branches of adaptGlassAlpha() and describe what is actually painted behind
// each glass surface, so the fix targets the real backdrop instead of a guessed constant.
(function () {
    const cs = (el, p) => el ? getComputedStyle(el)[p] : null;
    const bar = document.querySelector('.phone-action-bar');
    const hero = document.querySelector('.player-area.empty .empty-hero');
    const panel = document.querySelector('.header-collapsed .header-actions-group');
    const meta = document.querySelector('.metadata-panel');
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    const chainOf = (el) => {
        if (!el) return null;
        const out = [];
        let n = el;
        while (n && out.length < 8) {
            const st = getComputedStyle(n);
            const cls = (typeof n.className === 'string') ? n.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
            out.push({ node: n.tagName + (n.id ? '#' + n.id : '') + (cls ? '.' + cls : ''), bg: st.backgroundColor, img: (st.backgroundImage || '').slice(0, 44), op: st.opacity });
            n = n.parentElement;
        }
        return out;
    };
    const imgs = [...document.querySelectorAll('#mainContent img')].slice(0, 6)
        .map((i) => ({ cls: (i.className || '').slice(0, 28), ok: i.complete, nat: i.naturalWidth + 'x' + i.naturalHeight, src: (i.currentSrc || i.src || '').slice(0, 56) }));
    return JSON.stringify({
        gs: (typeof glassState === 'object') ? glassState : null,
        branches: {
            glassLens: document.documentElement.classList.contains('glass-lens'),
            solid: document.documentElement.classList.contains('solid-material'),
            hidden: document.hidden,
            barExists: !!bar, barVisible: bar ? (bar.offsetParent !== null) : null,
            barDisplay: cs(bar, 'display'), barOpacity: cs(bar, 'opacity'),
        },
        inlineAlpha: document.documentElement.style.getPropertyValue('--lens-alpha'),
        computedAlpha: getComputedStyle(document.documentElement).getPropertyValue('--lens-alpha').trim(),
        lensFillVar: getComputedStyle(document.documentElement).getPropertyValue('--lens-fill').trim(),
        rects: { bar: rect(bar), hero: rect(hero), panel: rect(panel), meta: rect(meta) },
        heroChain: chainOf(hero),
        barChain: chainOf(bar),
        bodyBg: cs(document.body, 'backgroundColor'),
        pageImages: imgs,
        videoReady: [...document.querySelectorAll('.video-container video')].map((v) => v.readyState).join(','),
    }, null, 1);
})()
