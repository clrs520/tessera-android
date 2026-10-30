(() => { const cp = viewer.continuousPlayer, v = viewer.multiCameraPlayer.players.front;
  return { log: window.__log, now: { seg: cp.currentSegmentIndex, ct: +cp.getCurrentTime().toFixed(2),
    local: +v.currentTime.toFixed(2), paused: v.paused, seeking: v.seeking, dur: isFinite(v.duration)?+v.duration.toFixed(2):null,
    rs: v.readyState, flag: viewer.multiCameraPlayer.isPlaying } }; })()
