// R67 acceptance: arm a pointer-event recorder on playerArea, and report the touch-action chain.
(() => {
  const area = viewer.dom.playerArea;
  if (!window.__plog) window.__plog = [];
  if (!window.__parmed) {
    window.__parmed = true;
    ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchmove','touchcancel','scroll'].forEach(t => {
      area.addEventListener(t, e => {
        window.__plog.push([t, e.pointerId, e.pointerType, Math.round(e.clientX), Math.round(e.clientY), e.cancelable, e.defaultPrevented]);
      }, t === 'scroll');
    });
    // Also on window, to see whether the pointer leaves the area (browser gesture takeover).
    ['pointerup','pointercancel'].forEach(t => window.addEventListener(t, e => {
      window.__plog.push(['win:' + t, e.pointerId, e.pointerType, Math.round(e.clientX), Math.round(e.clientY), e.cancelable, e.defaultPrevented]);
    }));
  }
  const ta = el => el ? getComputedStyle(el).touchAction : null;
  return {
    armed: true,
    areaTouchAction: ta(area),
    controlsLeftTouchAction: ta(document.elementFromPoint(150, 280)),
    bodyTouchAction: ta(document.body),
    htmlTouchAction: ta(document.documentElement)
  };
})();
