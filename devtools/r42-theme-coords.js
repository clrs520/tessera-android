(() => {
    const d = window.devicePixelRatio;
    const seg = mode => {
        const s = document.querySelector(`#themeChoice .choice-segment[data-mode="${mode}"]`);
        if (!s) return null;
        const r = s.getBoundingClientRect();
        return [Math.round((r.left + r.width / 2) * d), Math.round((r.top + r.height / 2) * d)];
    };
    return JSON.stringify({
        open: !!document.querySelector('.header-right.active'),
        dark: seg('dark'),
        light: seg('light'),
    });
})()
