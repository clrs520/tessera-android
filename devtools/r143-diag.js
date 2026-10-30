(async () => {
  const v = window.viewer; if (!v) return 'no viewer';
  const p = v.multiCameraPlayer.players.front;
  return JSON.stringify({
    currentEvent: v.currentEvent ? v.currentEvent.eventId : null,
    isScanning: !!v.isScanning, peStarting: !!v.peStarting, peJob: !!v.peJob,
    front: p ? { src: (p.currentSrc || p.src || '').split('/').pop(), rs: p.readyState, ns: p.networkState,
      err: p.error ? p.error.code : null, paused: p.paused, t: p.currentTime, dur: p.duration } : null,
    gate: !!v.multiCameraPlayer.seam, transitioning: !!v.continuousPlayer.isTransitioning,
    bodyClass: document.body.className,
  }, null, 1);
})()
