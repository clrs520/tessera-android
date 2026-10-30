(() => {
  const cs = el => getComputedStyle(el);
  const d = document.getElementById('phoneBrightnessDim');
  const h = document.getElementById('phoneBrightnessHud');
  const v = window.viewer;
  return JSON.stringify({
    dim: d ? { op: cs(d).opacity, bg: cs(d).backgroundColor, pe: cs(d).pointerEvents, z: cs(d).zIndex } : 'missing',
    hud: h ? { cls: h.className, txt: h.textContent.replace(/\s+/g, ' ').trim() } : 'missing',
    level: v.brightnessLevel,
    stored: localStorage.getItem('tdashcam.brightness')
  }, null, 1);
})()
