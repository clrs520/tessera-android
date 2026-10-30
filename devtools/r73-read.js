(function(){
const vs = Array.from(document.querySelectorAll('video'));
const out = { playing: viewer.multiCameraPlayer ? viewer.multiCameraPlayer.isPlaying : null, vids: [] };
for (const v of vs) {
  out.vids.push({ cam: v.dataset ? v.dataset.camera : null, rs: v.readyState,
    err: v.error ? v.error.code : null, cur: +v.currentTime.toFixed(2),
    dur: isFinite(v.duration) ? +v.duration.toFixed(3) : null, w: v.videoWidth, h: v.videoHeight,
    painted: v.videoHeight > 0 });
}
out.labels = [];
for (const e of document.querySelectorAll('.player-item, .video-container, .camera-label')) {
  const t = (e.textContent || '').trim();
  if (/解码失败|无法播放|Decode/.test(t)) out.labels.push(t.slice(0, 60));
}
return JSON.stringify(out);
})()
