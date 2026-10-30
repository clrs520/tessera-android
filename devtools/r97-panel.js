(async () => {
    const p = document.querySelector('.header-actions-group');
    const cs = getComputedStyle(p);
    return JSON.stringify({ cls: p.className, transform: cs.transform, opacity: cs.opacity,
        vis: cs.visibility, pe: cs.pointerEvents, rectH: p.getBoundingClientRect().height, offsetH: p.offsetHeight });
})();
