// R67 acceptance: report the geometry the brightness gesture will use, plus the live overlay state.
(() => {
  const b = viewer.pictureGestureBand();
  const r = viewer.dom.playerArea.getBoundingClientRect();
  return {
    band: b ? { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) } : null,
    area: { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    dpr: devicePixelRatio,
    level: viewer.brightnessLevel,
    stored: localStorage.getItem('tdashcam.brightness'),
    row: document.getElementById('brightnessRowLabel') && document.getElementById('brightnessRowLabel').textContent,
    rowDisabled: document.getElementById('brightnessRowBtn') && document.getElementById('brightnessRowBtn').disabled
  };
})();
