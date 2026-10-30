(() => {
    try {
        if (typeof viewer !== 'object') return JSON.stringify({ FATAL: 'no viewer' });
        const mode = 'dark';
        viewer.applyTheme(true);
        const c = getComputedStyle(document.body);
        const h = getComputedStyle(document.getElementById('emptyHero'));
        const a = getComputedStyle(document.getElementById('playerArea'));
        return JSON.stringify({
            bodyBg: c.backgroundColor,
            areaBg: a.backgroundColor,
            heroBg: h.backgroundColor,
            heroBackdrop: h.backdropFilter,
            edge: h.borderColor,
            title: getComputedStyle(document.querySelector('.empty-hero-title')).color,
            hint: getComputedStyle(document.querySelector('.empty-hero-hint')).color,
            icon: getComputedStyle(document.querySelector('.empty-hero-icon')).backgroundColor,
            iconGlyph: getComputedStyle(document.querySelector('.empty-hero-icon')).color,
            btn: getComputedStyle(document.getElementById('emptyHeroBtn')).backgroundColor,
            html: document.documentElement.className,
        });
    } catch (e) { return 'THREW ' + e.message; }
})()
