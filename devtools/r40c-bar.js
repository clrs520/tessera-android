(() => {
    const out = [];
    document.querySelectorAll('.mobile-tab-bar button, nav.mobile-nav button, .mobile-nav button').forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.width < 1) return;
        out.push({ txt: b.textContent.trim().slice(0,8), x: Math.round((r.left+r.width/2)*devicePixelRatio), y: Math.round((r.top+r.height/2)*devicePixelRatio) });
    });
    return { dpr: devicePixelRatio, w: innerWidth, h: innerHeight, out };
})()
