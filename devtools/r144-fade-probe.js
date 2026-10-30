// 谁在控件可见时把这条盖住：控件纱的渐变；以及浅色下这条缝还在不在。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const box = document.querySelector('.video-container.is-active-single');
  const ov = document.querySelector('.video-controls-overlay');
  const read = (tag) => {
    const so = getComputedStyle(ov);
    const sb = getComputedStyle(ov, '::before');
    const sa = getComputedStyle(ov, '::after');
    return {
      tag,
      overlayCls: ov.className,
      overlayBg: so.backgroundColor, overlayImg: so.backgroundImage.slice(0, 120),
      overlayOpacity: so.opacity,
      before: { bg: sb.backgroundColor, img: sb.backgroundImage.slice(0, 120), op: sb.opacity, h: sb.height },
      after: { bg: sa.backgroundColor, img: sa.backgroundImage.slice(0, 120), op: sa.opacity, h: sa.height },
      containerBg: getComputedStyle(box).backgroundColor,
      playerAreaBg: getComputedStyle(document.querySelector('.player-area')).backgroundColor,
      mainBg: getComputedStyle(document.querySelector('.main-content')).backgroundColor,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  };
  const out = [];
  localStorage.setItem('tdashcam.themeMode', 'dark'); v.applyTheme(true); await sleep(400);
  ov.classList.add('show'); await sleep(200); out.push(read('dark-controls-show'));
  ov.classList.remove('show'); await sleep(600); out.push(read('dark-controls-hidden'));
  localStorage.setItem('tdashcam.themeMode', 'light'); v.applyTheme(false); await sleep(400);
  out.push(read('light'));
  localStorage.setItem('tdashcam.themeMode', 'auto'); v.applyTheme(v.resolveThemeDark('auto'));
  return JSON.stringify(out, null, 1);
})()
