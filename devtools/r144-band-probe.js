// 深色 + 单路 + 控件已隐藏：HUD 下方那条到底是谁在画。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.currentEvent) { v.playEvent(v.eventGroups.find(g => (g.segments || []).length >= 2)); await sleep(4000); }
  localStorage.setItem('tdashcam.themeMode', 'dark');
  v.applyTheme(true);
  v.multiCameraPlayer.setLayout('single');
  await sleep(1500);
  // 让控件真的处于「已隐藏」那一档：先唤出再交给它自己的计时器
  const area = document.querySelector('.player-area');
  const box = document.querySelector('.video-container.is-active-single');
  const vid = box && box.querySelector('video');
  const cs = el => el ? getComputedStyle(el) : null;
  const bg = el => { const s = cs(el); return s ? { bg: s.backgroundColor, img: s.backgroundImage.slice(0, 60),
      op: s.opacity, z: s.zIndex, bf: s.webkitBackdropFilter || s.backdropFilter, disp: s.display, vis: s.visibility } : null; };
  const rect = el => { if (!el) return null; const r = el.getBoundingClientRect();
      return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) }; };
  const probe = {
    dark: document.body.classList.contains('dark-theme'),
    layout: v.multiCameraPlayer.layoutMode, controlsHidden: area ? area.className : null,
    body: bg(document.body), main: bg(document.querySelector('.main-content')),
    playerArea: bg(area), container: bg(box), video: bg(vid),
    rectContainer: rect(box), rectVideo: rect(vid),
    videoIntrinsic: vid ? { w: vid.videoWidth, h: vid.videoHeight, fit: cs(vid).objectFit } : null,
  };
  if (box) {
    const r = box.getBoundingClientRect();
    const y = Math.min(r.bottom - 30, innerHeight - 30);
    probe.stackAtBottomBand = document.elementsFromPoint(innerWidth / 2, y).slice(0, 8)
        .map(el => { const s = getComputedStyle(el);
          return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 46),
                   bg: s.backgroundColor, z: s.zIndex, op: s.opacity, bf: (s.webkitBackdropFilter || 'none').slice(0, 24) }; });
    probe.pointY = Math.round(y);
  }
  return JSON.stringify(probe, null, 1);
})()
