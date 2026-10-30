(() => {
  const a = viewer.continuousPlayer.applySeek.toString();
  const p = viewer.continuousPlayer.playNextSegment.toString();
  return JSON.stringify({
    applySeek_bare_playAll: /wasPlaying\)\s*\{[^}]*player\.playAll\(\);/.test(a),
    applySeek_awaits_playAll: a.includes('await player.playAll'),
    applySeek_truthcheck: a.includes('updatePlayState(nowPlaying)'),
    playNext_awaits_playAll: p.includes('await this.multiCameraPlayer.playAll'),
    playNext_bare_playAll: p.includes('this.multiCameraPlayer.playAll();'),
    has_band: typeof pictureGestureBand === 'function',
    band_now: typeof pictureGestureBand === 'function' ? JSON.stringify(pictureGestureBand()) : null,
    total: viewer.continuousPlayer.totalDuration,
    layout: viewer.layoutMode,
  });
})()
