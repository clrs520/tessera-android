(() => {
  const R = (e) => {
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
  };
  const plate = document.querySelector('.stats-overlay');
  const card = document.querySelector('.metadata-panel');
  const vids = [...document.querySelectorAll('video')].filter(v => v.getBoundingClientRect().width > 0);
  // `object-fit: contain` means the element rect is not the picture: work out the letterboxed
  // content box, because "does it cover the video" has to be measured against pixels, not bars.
  const art = vids.map((v) => {
    const b = v.getBoundingClientRect();
    if (!v.videoWidth) return R(v);
    const scale = Math.min(b.width / v.videoWidth, b.height / v.videoHeight);
    const w = v.videoWidth * scale, h = v.videoHeight * scale;
    return [Math.round(b.x + (b.width - w) / 2), Math.round(b.y + (b.height - h) / 2),
      Math.round(w), Math.round(h)];
  });
  const pr = R(plate);
  let overlapWithArt = null;
  let coveredPct = 0;
  if (pr && art.length) {
    overlapWithArt = art.map((a) => {
      const w = Math.min(pr[0] + pr[2], a[0] + a[2]) - Math.max(pr[0], a[0]);
      const h = Math.min(pr[1] + pr[3], a[1] + a[3]) - Math.max(pr[1], a[1]);
      if (w <= 0 || h <= 0) return null;
      coveredPct += w * h;
      return { art: a, overlap: [w, h], pctOfArt: +(w * h / (a[2] * a[3]) * 100).toFixed(1) };
    }).filter(Boolean);
    const total = art.reduce((s, a) => s + a[2] * a[3], 0);
    coveredPct = +(coveredPct / total * 100).toFixed(1);
  }
  return JSON.stringify({
    shown: plate ? plate.classList.contains('show') : null,
    plate: pr,
    card: R(card),
    cardDisplay: card ? getComputedStyle(card).display : null,
    arts: art,
    overlaps: overlapWithArt,
    coveredPct,
    vals: [...document.querySelectorAll('.stats-value')].map(s => s.textContent.trim()).join('|'),
    vw: innerWidth, vh: innerHeight,
  }, null, 1);
})()
