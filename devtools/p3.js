(() => { const b = viewer.pictureGestureBand(); const p = viewer.multiCameraPlayer;
  const el = p.players[p.activeCamera]; const r = el.getBoundingClientRect();
  return { band: b, videoRect: [r.left, r.top, r.width, r.height],
           nw: el.videoWidth, nh: el.videoHeight,
           zoom: viewer.feedZoom && viewer.feedZoom[p.activeCamera] }; })()
