// Landscape HUD card as it looks during single-feed playback, on the installed build.
// Run via: node devtools/cdp-eval.mjs --file devtools/probe-r16-hud.mjs
(async () => {
  viewer.multiCameraPlayer.setLayout('single');
  const panel = document.getElementById('metadataPanel');
  panel.classList.remove('collapsed');
  // This session has no SEI metadata, so the manager keeps #metadataItems hidden and shows the
  // "no data" line; force the real dashboard back in to measure the card as it looks in playback.
  document.getElementById('metadataEmpty').style.display = 'none';
  document.getElementById('metadataLoading').style.display = 'none';
  document.getElementById('metadataItems').style.display = 'flex';
  const gear = panel.querySelector('.meta-gear');
  if (gear) gear.textContent = 'D';
  const speed = document.getElementById('metaSpeed');
  if (speed) speed.textContent = '63';
  await new Promise(r => setTimeout(r, 500));

  const box = el => {
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`;
  };
  const p = panel.getBoundingClientRect();
  const feed = document.querySelector('.player-area video').getBoundingClientRect();
  const area = document.querySelector('.player-area').getBoundingClientRect();
  const picW = Math.round(area.height * 16 / 9);
  const pic = [Math.round(area.x + (area.width - picW) / 2), Math.round(area.x + (area.width + picW) / 2)];
  const zoom = document.querySelector('.camera-zoom-out-btn');
  const zr = zoom && zoom.offsetParent ? zoom.getBoundingClientRect() : null;
  return JSON.stringify({
    vp: `${innerWidth}x${innerHeight}`,
    layout: document.querySelector('.player-area').className,
    panel: box(panel),
    panelCss: `${getComputedStyle(panel).position} top=${getComputedStyle(panel).top} left=${getComputedStyle(panel).left} maxWidth=${getComputedStyle(panel).maxWidth}`,
    dashboard: box(document.querySelector('.metadata-dashboard')),
    secondary: getComputedStyle(document.querySelector('.metadata-secondary')).display,
    feed: box(document.querySelector('.player-area video')),
    pictureBandX: `${pic[0]}..${pic[1]}`,
    coversPicture: p.right > feed.x && p.left < feed.right && p.bottom > feed.y && p.top < feed.bottom,
    controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h'),
    actionH: getComputedStyle(document.documentElement).getPropertyValue('--action-h'),
    zoomBtn: zr ? `${Math.round(zr.width)}x${Math.round(zr.height)}@${Math.round(zr.x)},${Math.round(zr.y)} clearOfHud=${zr.left > p.right}` : 'hidden',
  }, null, 1);
})()
