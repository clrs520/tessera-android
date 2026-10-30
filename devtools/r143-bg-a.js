(async () => {
  const v = window.viewer; if (!v) return 'no viewer';
  const ev = v.eventGroups[0];
  v.playEvent(ev);
  const t = Date.now();
  while (!v.multiCameraPlayer?.isPlaying && Date.now() - t < 20000) await new Promise(r => setTimeout(r, 200));
  await new Promise(r => setTimeout(r, 1500));
  const cp = v.continuousPlayer;
  const rec = { wall0: Date.now(), media0: cp.getCurrentTime(),
    feeds: Object.entries(v.multiCameraPlayer.players).map(([k, p]) => k + ':' + (p ? p.currentTime.toFixed(2) : '-')).join(' '),
    playing: !!v.multiCameraPlayer.isPlaying, seg: cp.currentSegmentIndex };
  localStorage.setItem('__r143bg', JSON.stringify(rec));
  return JSON.stringify(rec);
})()
