(() => {
    if (window.__r47cap) return JSON.stringify({already: true, log: window.__r47cap});
    window.__r47cap = [];
    const rec = (type, e) => {
        const t = e.target;
        window.__r47cap.push({
            type,
            // A touch and a pointer describe the same gesture twice; the coordinate of the first
            // sample tells us whether the sequence ever started on the grabber.
            x: Math.round((e.clientX ?? e.touches?.[0]?.clientX ?? -1) * 10) / 10,
            y: Math.round((e.clientY ?? e.touches?.[0]?.clientY ?? -1) * 10) / 10,
            tgt: typeof t?.className === 'string' ? t.className : (t?.id || t?.nodeName || '?'),
            n: e.touches ? e.touches.length : 1,
        });
        if (window.__r47cap.length > 40) window.__r47cap.shift();
    };
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
        document.addEventListener(type, (e) => rec(type, e), {capture: true});
    }
    for (const type of ['touchstart', 'touchmove', 'touchend']) {
        document.addEventListener(type, (e) => rec(type, e), {capture: true, passive: true});
    }
    const g = document.querySelector('#androidDirModal .sheet-grabber');
    const r = g?.getBoundingClientRect();
    return JSON.stringify({
        armed: true,
        grabberRect: r ? [r.x, r.y, r.width, r.height] : null,
        cssTouchAction: g ? getComputedStyle(g).touchAction : null,
    });
})()
