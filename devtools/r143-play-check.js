(() => {
  const v = window.viewer;
  return JSON.stringify({ event: v.currentEvent ? v.currentEvent.eventId : null,
    segs: v.currentEvent ? v.currentEvent.segments.length : 0,
    playing: !!v.multiCameraPlayer.isPlaying, frontRs: v.multiCameraPlayer.players.front.readyState });
})()
