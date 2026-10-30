// R38 sweep: find text that is cut off without an ellipsis, and boxes that run past the viewport.
// Call with a screen already open; it only reads geometry.
(() => {
    const clipped = [];
    const offscreen = [];
    const seen = new Set();

    const vis = (el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
        const b = el.getBoundingClientRect();
        return b.width > 1 && b.height > 1;
    };
    const own = (el) => Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .filter(Boolean)
        .join(' ');
    const path = (el) => {
        const bits = [el.tagName.toLowerCase()];
        if (el.id) bits[0] += '#' + el.id;
        if (el.className && typeof el.className === 'string') bits[0] += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.');
        let p = el.parentElement;
        while (p && bits.length < 3) {
            const s = p.tagName.toLowerCase() + (p.id ? '#' + p.id : '');
            bits.unshift(s);
            p = p.parentElement;
        }
        return bits.join(' > ');
    };

    for (const el of document.querySelectorAll('body *')) {
        if (!vis(el)) continue;
        const cs = getComputedStyle(el);
        const t = own(el);
        if (t) {
            const ellipsis = cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none';
            const hx = el.scrollWidth > el.clientWidth + 1;
            const vy = el.scrollHeight > el.clientHeight + 1;
            if (!ellipsis && (hx || vy) && cs.overflowX !== 'visible' && cs.overflowY !== 'visible') {
                const key = path(el) + '|' + t.slice(0, 24);
                if (!seen.has(key)) {
                    seen.add(key);
                    clipped.push({
                        where: path(el),
                        text: t.slice(0, 40),
                        axis: [hx && vy ? 'xy' : hx ? 'x' : 'y'],
                        box: [el.clientWidth, el.clientHeight],
                        need: [el.scrollWidth, el.scrollHeight],
                        overflow: [cs.overflowX, cs.overflowY],
                        scrollable: el.scrollHeight > el.clientHeight && /auto|scroll/.test(cs.overflowY),
                    });
                }
            }
        }
        const b = el.getBoundingClientRect();
        const fixed = cs.position === 'fixed';
        if (fixed && (b.top < -2 || b.left < -2 || b.right > innerWidth + 2 || b.bottom > innerHeight + 2)) {
            offscreen.push({ where: path(el), rect: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] });
        }
    }

    return {
        vp: innerWidth + 'x' + innerHeight,
        lang: window.viewer.currentLanguage,
        bodyClass: document.body.className,
        clipped: clipped.slice(0, 30),
        offscreen: offscreen.slice(0, 15),
    };
})()
