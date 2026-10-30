// R38: hero-vs-bar clearance for one language, in the current orientation.
(() => {
    const lang = window.__r38Lang || 'zh';
    window.viewer.setLanguage(lang);
    return new Promise((res) => setTimeout(() => {
        const pa = document.querySelector('.player-area');
        const had = pa.classList.contains('empty');
        if (!had) pa.classList.add('empty');
        const h = document.querySelector('.empty-hero').getBoundingClientRect();
        const b = document.getElementById('phoneActionBar').getBoundingClientRect();
        if (!had) pa.classList.remove('empty');
        res({
            lang,
            vp: innerWidth + 'x' + innerHeight,
            heroTop: Math.round(h.top),
            heroBottom: Math.round(h.bottom),
            heroH: Math.round(h.height),
            barTop: Math.round(b.top),
            gap: Math.round(b.top - h.bottom),
        });
    }, 1200));
})()
