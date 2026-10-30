(() => {
  const q = (s) => document.querySelector(s);
  const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.offsetParent !== null;
  const v = q('video');
  return {
    vw: innerWidth, vh: innerHeight,
    listVisible: vis(q('#fileListPanel')) || vis(q('.sidebar')),
    videoVisible: vis(q('#videoContainer')),
    clipBtn: q('#clipBtn') ? {display: getComputedStyle(q('#clipBtn')).display, vis: vis(q('#clipBtn'))} : null,
    tabListBtn: q('#tabListBtn') ? vis(q('#tabListBtn')) : null,
    playing: v ? !v.paused : null,
    dur: v && v.duration ? +v.duration.toFixed(1) : null,
    activeVideos: [...document.querySelectorAll('video')].map(x => ({src: (x.currentSrc||'').slice(-40), w: x.videoWidth, h: x.videoHeight})).filter(x=>x.src),
    sheetOpen: vis(q('#phoneExportModal')),
    folder: (q('#currentPath')||{}).textContent || null,
  };
})()
