// R67 acceptance: where can a real finger land so the drag stays with the app (touch-action:none)?
(() => {
  const out = [];
  document.querySelectorAll('.video-container').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    out.push({
      cam: el.dataset && el.dataset.camera,
      ta: getComputedStyle(el).touchAction,
      l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2)
    });
  });
  return out;
})();
