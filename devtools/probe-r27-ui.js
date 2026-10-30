(() => {
  const app = window.viewer || window.tdashcamApp;
  const rect = (sel) => {
    const e = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (!e) return null;
    const b = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), disp: cs.display, z: cs.zIndex };
  };
  const plate = document.querySelector('#metaDetailOverlay');
  const panel = document.querySelector('#metadataPanel');
  return JSON.stringify({
    vp: [innerWidth, innerHeight],
    fullscreen: document.body.classList.contains('phone-fullscreen'),
    header: rect('.main-header'),
    bar: rect('#phoneActionBar'),
    player: rect('#playerArea'),
    fsBtn: rect('#fullscreenBtn'),
    fsBtnTitle: document.getElementById('fullscreenBtn')?.title,
    fsBtnDisabled: document.getElementById('fullscreenBtn')?.disabled,
    hud: rect(panel),
    hudCollapsed: panel?.classList.contains('collapsed'),
    plate: rect(plate),
    plateShown: plate?.classList.contains('show'),
    dim: document.getElementById('phoneBrightnessDim')?.style.opacity || '0',
    level: app?.brightnessLevel,
    layers: app?.reportedLayerCount,
    controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h').trim(),
    actionH: getComputedStyle(document.documentElement).getPropertyValue('--action-h').trim(),
  }, null, 1);
})()
