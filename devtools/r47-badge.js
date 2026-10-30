(() => {
    // The CDP probe and the screen have to be the same page for any of this to mean anything, so
    // make the counter visible: if the badge changes on screen but not over CDP, two contexts.
    let b = document.getElementById('r47badge');
    if (!b) {
        b = document.createElement('div');
        b.id = 'r47badge';
        b.style.cssText = 'position:fixed;left:2px;top:34px;z-index:99999;background:#c00;color:#fff;' +
            'font:12px/1.4 monospace;padding:2px 6px;border-radius:4px;pointer-events:none';
        document.body.appendChild(b);
    }
    window.__r47cap = window.__r47cap || [];
    if (!window.__r47badgeed) {
        window.__r47badgeed = true;
        const bump = (type, e) => {
            const y = e.clientY ?? e.touches?.[0]?.clientY ?? -1;
            const x = e.clientX ?? e.touches?.[0]?.clientX ?? -1;
            b.textContent = `${type} ${Math.round(x)},${Math.round(y)}`;
        };
        for (const t of ['pointerdown', 'pointermove', 'pointerup', 'touchstart', 'touchmove', 'touchend']) {
            document.addEventListener(t, (e) => bump(t, e), {capture: true});
        }
    }
    b.textContent = `armed n=${window.__r47cap.length}`;
    return JSON.stringify({badge: b.textContent, html: document.documentElement.className});
})()
