// 判据的洞：transparent 在「没载入事件」时也算过，可那时候 .player-area 不是黑的。
// 这一支只报现场：事件在不在、.player-area 的类和底色、画面 rect、letterbox 的几何。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  localStorage.setItem('tdashcam.themeMode', 'dark'); v.applyTheme(true);
  if (!v.currentEvent) { v.playEvent(v.eventGroups.find(g => (g.segments || []).length >= 2)); }
  v.multiCameraPlayer.setLayout('single');
  await sleep(6000);
  const area = document.querySelector('.player-area');
  const box = document.querySelector('.video-container.is-active-single');
  const vid = box && box.querySelector('video');
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect();
      return { t: Math.round(b.top), b: Math.round(b.bottom), h: Math.round(b.height) }; };
  return JSON.stringify({
    event: !!v.currentEvent, playing: !!v.isPlaying,
    areaCls: area.className, areaBg: getComputedStyle(area).backgroundColor, areaRect: r(area),
    containerBg: box ? getComputedStyle(box).backgroundColor : null, containerRect: r(box),
    videoRect: r(vid), videoIntrinsic: vid ? { w: vid.videoWidth, h: vid.videoHeight } : null,
    readyState: vid ? vid.readyState : null,
  }, null, 1);
})()
