(() => {
  const mcp = window.viewer.multiCameraPlayer;
  const snap = () => Object.fromEntries(Object.entries(mcp.players).map(([k,p]) => [k, p.currentTime]));
  const a = snap(); const t0 = performance.now();
  return new Promise(res => setTimeout(() => {
    const b = snap(); const dt = (performance.now() - t0) / 1000;
    res(JSON.stringify({
      mode: mcp.layoutMode, suspended: Array.from(mcp.suspendedFeeds), isPlaying: mcp.isPlaying,
      secondsMeasured: +dt.toFixed(2),
      advance: Object.fromEntries(Object.entries(b).map(([k,v]) => [k, +((v - a[k]) / dt).toFixed(2)])),
      spread: +(Math.max(...Object.values(b)) - Math.min(...Object.values(b).filter((v,i) => !mcp.suspendedFeeds.has(Object.keys(mcp.players)[i])))).toFixed(2),
      rate: mcp.playbackRate,
    }));
  }, 4000));
})()
