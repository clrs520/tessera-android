(() => {
  try {
    const before = localStorage.getItem('tdashcam.brightness');
    let called = 'none';
    if (typeof viewer?.setBrightness === 'function') { viewer.setBrightness(0.6, false); called = 'viewer.setBrightness'; }
    else if (typeof viewer?.setPhoneBrightness === 'function') { viewer.setPhoneBrightness(0.6, false); called = 'setPhoneBrightness'; }
    const dim = document.querySelector('#phoneBrightnessDim');
    const hero = document.querySelector('#emptyHero');
    const r = hero.getBoundingClientRect();
    return JSON.stringify({
      called, before, after: localStorage.getItem('tdashcam.brightness'),
      dimOpacity: getComputedStyle(dim).opacity, dimZ: getComputedStyle(dim).zIndex,
      heroZ: getComputedStyle(hero).zIndex,
      heroCentre: [Math.round(r.left + r.width/2), Math.round(r.top + r.height/2)],
      pointOutsideHero: [Math.round(r.left - 60), Math.round(r.top + r.height/2)],
    });
  } catch (e) { return 'THREW ' + e.message; }
})()
