(async () => {
  try {
    const hero = document.querySelector('#emptyHero');
    const dim = document.querySelector('#phoneBrightnessDim');
    const hud = document.querySelector('#phoneBrightnessHud');
    const cs = getComputedStyle(hero);
    const cd = getComputedStyle(dim);
    const r = hero.getBoundingClientRect();
    const cx = Math.round(r.left + r.width / 2);
    const cy = Math.round(r.top + r.height / 2);
    const top = document.elementFromPoint(cx, cy);
    const out = {
      theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
      solidMaterial: document.documentElement.classList.contains('solid-material'),
      highContrast: document.documentElement.classList.contains('high-contrast'),
      version: window.viewer?.APP_VERSION ?? 'unknown',
      heroVisible: cs.display !== 'none' && r.width > 0,
      heroBg: cs.backgroundColor,
      heroBackdrop: cs.backdropFilter || cs.webkitBackdropFilter,
      heroBorder: cs.borderTopColor,
      heroZ: cs.zIndex,
      heroPosition: cs.position,
      heroRect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      dimZ: cd.zIndex,
      dimBg: cd.backgroundColor,
      dimOpacity: cd.opacity,
      hudZ: getComputedStyle(hud).zIndex,
      topHitAtHeroCentre: top ? (top.id || top.className) : 'null',
      heroAboveDim: (() => {
        const els = [hero, dim].map(e => {
          let node = e, order = [];
          while (node && node !== document.body) {
            const s = getComputedStyle(node);
            order.push(s.zIndex === 'auto' ? -1 : parseInt(s.zIndex, 10));
            node = node.parentElement;
          }
          return order;
        });
        return JSON.stringify(els);
      })(),
      brightnessStored: localStorage.getItem('tdashcam.brightness'),
    };
    return JSON.stringify(out, null, 1);
  } catch (e) {
    return 'THREW ' + e.message;
  }
})()
