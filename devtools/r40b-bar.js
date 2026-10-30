(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 20 && r.height > 20 && r.top > innerHeight * 0.8;
    });
    return {
        vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
        bottom: btns.map(b => {
            const r = b.getBoundingClientRect();
            return {
                id: b.id, txt: (b.textContent || '').trim().slice(0, 8),
                tapX: Math.round((r.left + r.width / 2) * devicePixelRatio),
                tapY: Math.round((r.top + r.height / 2) * devicePixelRatio),
            };
        }),
    };
})()
