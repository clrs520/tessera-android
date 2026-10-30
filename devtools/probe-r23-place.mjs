(() => {
  const mm = window.viewer.metadataManager;
  const el = mm.dom.statsOverlay;
  const area = mm.dom.playerArea.getBoundingClientRect();
  const feeds = [...mm.dom.playerArea.querySelectorAll('video')]
      .map(v => ({ box: v.getBoundingClientRect(), video: v }))
      .filter(f => f.box.width > 0);
  const artBottom = Math.max(...feeds.map(f => f.box.bottom));
  const chrome = document.querySelector('.video-controls-overlay')?.getBoundingClientRect();
  const floor = chrome && chrome.top > artBottom ? chrome.top : area.bottom;
  const arts = feeds.map(({ box, video }) => {
      const r = video.videoWidth ? (() => {
          const s = Math.min(box.width / video.videoWidth, box.height / video.videoHeight);
          const w = video.videoWidth * s, h = video.videoHeight * s;
          return { left: box.x + (box.width - w) / 2, right: box.x + (box.width + w) / 2,
              top: box.y + (box.height - h) / 2, bottom: box.y + (box.height + h) / 2 };
      })() : { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      return r;
  });
  const spot = el.getBoundingClientRect();
  const hitArea = (top) => { const bottom = top + spot.height; return arts.reduce((s, a) => {
      const w = Math.min(spot.right, a.right) - Math.max(spot.left, a.left);
      const h = Math.min(bottom, a.bottom) - Math.max(top, a.top);
      return w > 0 && h > 0 ? s + w * h : s; }, 0); };
  const ceil = mm.measureSafeTop() + 4;
  const hi = Math.max(ceil, Math.round(floor - spot.height));
  const tot = arts.reduce((s, a) => s + (a.right - a.left) * (a.bottom - a.top), 0);
  const pct = (px) => +(px / tot * 100).toFixed(1);
  return JSON.stringify({
    branch: (floor - artBottom >= spot.height + 6) ? 'band' : 'search',
    areaBottom: Math.round(area.bottom), artBottom: Math.round(artBottom),
    chromeTop: chrome ? Math.round(chrome.top) : null, floor: Math.round(floor),
    ceil, hi, height: Math.round(spot.height), top: Math.round(spot.top),
    bandPct: pct(hitArea(Math.round(artBottom + 6))),
    curPct: pct(hitArea(Math.round(spot.top))),
    forcedBandTop: Math.round(artBottom + 6),
    forcedSearchTop: (() => { mm.placeStatsOverlay(); return Math.round(el.getBoundingClientRect().top); })(),
    ready: feeds.filter(f => f.video.videoWidth > 0).length + '/' + feeds.length,
  });
})()
