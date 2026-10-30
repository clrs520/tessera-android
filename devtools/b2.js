// R67 acceptance: why did the brightness gesture not engage? Report each gate the pointerdown handler checks.
(() => {
  const r = viewer.dom.playerArea.getBoundingClientRect();
  const el = document.elementFromPoint(150, 280);
  return {
    touchUi: document.documentElement.classList.contains('touch-ui'),
    isPhoneLayout: typeof isPhoneLayout === 'function' ? isPhoneLayout() : 'missing',
    isTouchShell: typeof isTouchShellRuntime === 'function' ? isTouchShellRuntime() : 'missing',
    hasEvent: !!viewer.currentEvent,
    fingerPoints: typeof viewer.pictureFingerPoints === 'function' ? viewer.pictureFingerPoints(1) : 'missing',
    blocks: typeof viewer.blocksFeedGesture === 'function' ? viewer.blocksFeedGesture({ target: el }) : 'missing',
    band: viewer.pictureGestureBand(),
    zoomed: typeof viewer.zoomedFeedAt === 'function' ? !!viewer.zoomedFeedAt({ clientX: 150, clientY: 280 }) : 'missing',
    atPoint: el && (el.id || el.className || el.tagName),
    inArea: el ? viewer.dom.playerArea.contains(el) : null,
    dimExists: !!document.getElementById('phoneBrightnessDim'),
    areaTag: viewer.dom.playerArea ? viewer.dom.playerArea.id || viewer.dom.playerArea.className : 'no playerArea'
  };
})();
