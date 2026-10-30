(() => {
    try {
        if (typeof window.viewer !== 'object') return JSON.stringify({ FATAL: 'no viewer' });
        const area = document.getElementById('playerArea');
        const hero = document.getElementById('emptyHero');
        const dim = document.getElementById('phoneBrightnessDim');
        const btn = document.getElementById('emptyHeroBtn');
        const title = document.querySelector('.empty-hero-title');
        const hint = document.querySelector('.empty-hero-hint');
        const cs = (el) => (el ? getComputedStyle(el) : null);
        const c = cs(hero), d = cs(dim), b = cs(btn);
        const before = getComputedStyle(area, '::before');
        const r = hero.getBoundingClientRect();
        // What is actually on top of the card's centre point?
        const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
        return JSON.stringify({
            theme: document.documentElement.dataset.theme || cs(document.body).backgroundColor,
            htmlClasses: document.documentElement.className,
            areaClass: area.className,
            brightnessStored: localStorage.getItem('tdashcam.brightness'),
            brightnessLevel: viewer.brightnessLevel,
            dim: { display: d.display, opacity: d.opacity, z: d.zIndex, bg: d.backgroundColor, id: dim.id },
            heroOnTopHitTest: hit ? (hit.id || hit.className) : null,
            hero: {
                rect: [Math.round(r.width), Math.round(r.height), Math.round(r.top)],
                zIndex: c.zIndex,
                bgColor: c.backgroundColor,
                backdrop: c.backdropFilter || c.webkitBackdropFilter,
                border: c.borderColor,
                opacity: c.opacity,
            },
            iconBg: cs(document.querySelector('.empty-hero-icon')).backgroundColor,
            titleColor: cs(title).color,
            hintColor: cs(hint).color,
            btnBg: b.background.slice(0, 90),
            areaBg: cs(area).backgroundColor,
            beforeBg: before.backgroundImage.slice(0, 160),
        });
    } catch (e) {
        return 'THREW ' + e.message;
    }
})()
