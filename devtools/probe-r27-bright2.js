(() => {
  const hud = document.getElementById('phoneBrightnessHud');
  const dim = document.getElementById('phoneBrightnessDim');
  const p = window.app?.player || window.player || null;
  return JSON.stringify({
    hudDisplay: getComputedStyle(hud).display,
    hudRect: getComputedStyle(hud).display !== 'none' ? (r => ({x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}))(hud.getBoundingClientRect()) : null,
    dimOpacity: getComputedStyle(dim).opacity,
    level: localStorage.getItem('tdashcam.brightness'),
    eventName: p?.currentEvent?.name || p?.currentEvent?.id || null,
    videoCount: document.querySelectorAll('video').length,
    zoom: getComputedStyle(document.querySelector('.video-grid, #videoGrid, .player-area')).transform || 'none',
  });
})()
