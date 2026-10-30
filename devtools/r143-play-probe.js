(async () => {
  const v = window.viewer;
  const ev = v.eventGroups.find(g => (g.segments || []).length >= 3) || v.eventGroups[0];
  const t0 = Date.now();
  const p = v.playEvent(ev);
  let threw = null;
  p.catch(e => { threw = String(e && e.message || e); });
  const t = Date.now();
  while (!v.currentEvent && Date.now() - t < 20000) await new Promise(r => setTimeout(r, 200));
  return JSON.stringify({ opened: !!v.currentEvent, ms: Date.now() - t0, threw,
    playing: !!v.multiCameraPlayer.isPlaying,
    frontRs: v.multiCameraPlayer.players.front.readyState,
    frontNs: v.multiCameraPlayer.players.front.networkState,
    frontErr: v.multiCameraPlayer.players.front.error ? v.multiCameraPlayer.players.front.error.code : null,
    isScanning: !!v.isScanning, groups: v.eventGroups.length });
})()
