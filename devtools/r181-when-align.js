JSON.stringify((() => {
    const card = document.querySelector('.video-card');
    if (!card) return { noCard: true };
    const cs = (n) => n ? getComputedStyle(n).textAlign : null;
    const info = card.querySelector('.video-info'), when = card.querySelector('.video-when');
    return { info: cs(info), when: cs(when), title: cs(card.querySelector('.card-info h3, .video-title')),
        cssRule: [...document.styleSheets].some((s) => { try {
            return [...s.cssRules].some((r) => r.selectorText && /\.video-when/.test(r.selectorText) && /text-align/.test(r.style.cssText || ''));
        } catch (e) { return false; } }) };
})());
