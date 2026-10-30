(() => {
    const d = window.devicePixelRatio;
    const at = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round((r.left + r.width / 2) * d), y: Math.round((r.top + r.height / 2) * d), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return JSON.stringify({
        dpr: d,
        start: at('#tapBehaviorChoice .choice-segment[data-mode="start"]'),
        event: at('#tapBehaviorChoice .choice-segment[data-mode="event"]'),
        light: at('#themeChoice .choice-segment[data-mode="light"]'),
        auto: at('#themeChoice .choice-segment[data-mode="auto"]'),
        panelOpen: !!document.querySelector('.header-right.active'),
    });
})()
