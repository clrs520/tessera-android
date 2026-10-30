// Run the placeStatsOverlay() algorithm against the live page and report what it would do.
(() => {
  const el = document.querySelector('.stats-overlay');
  const areaEl = document.getElementById('playerArea');
  const R = (b) => [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
  if (!el || !el.classList.contains('show')) return JSON.stringify({ error: 'plate not open' });

  const area = areaEl.getBoundingClientRect();
  const feeds = [...areaEl.querySelectorAll('video')].map(v => v.getBoundingClientRect()).filter(r => r.width > 0);
  const artTop = Math.min(...feeds.map(r => r.top));
  const artBottom = Math.max(...feeds.map(r => r.bottom));
  const chrome = document.querySelector('.video-controls-overlay')?.getBoundingClientRect();
  const floor = chrome && chrome.top > artBottom ? chrome.top : area.bottom;
  const ceil = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0) + 4;
  const gap = 6;
  const height = el.offsetHeight;
  let chosen;
  if (floor - artBottom >= height + gap) { el.style.top = `${Math.round(artBottom + gap)}px`; chosen = 'below'; }
  else { el.style.top = `${Math.round(Math.max(ceil, artTop - height - gap))}px`; chosen = 'hug-top'; }

  const plate = R(el.getBoundingClientRect());
  // letterboxed content, not the element box
  const arts = feeds.map((b, i) => {
    const v = [...areaEl.querySelectorAll('video')].filter(x => x.getBoundingClientRect().width > 0)[i];
    if (!v.videoWidth) return R(b);
    const sc = Math.min(b.width / v.videoWidth, b.height / v.videoHeight);
    const w = v.videoWidth * sc, h = v.videoHeight * sc;
    return [Math.round(b.x + (b.width - w) / 2), Math.round(b.y + (b.height - h) / 2), Math.round(w), Math.round(h)];
  });
  let covered = 0;
  arts.forEach((a) => {
    const w = Math.min(plate[0] + plate[2], a[0] + a[2]) - Math.max(plate[0], a[0]);
    const h = Math.min(plate[1] + plate[3], a[1] + a[3]) - Math.max(plate[1], a[1]);
    if (w > 0 && h > 0) covered += w * h;
  });
  const total = arts.reduce((s, a) => s + a[2] * a[3], 0);
  return JSON.stringify({
    vw: innerWidth, vh: innerHeight,
    chosen, plate, plateH: height,
    area: R(area), artTop: Math.round(artTop), artBottom: Math.round(artBottom),
    floor: Math.round(floor), ceil: Math.round(ceil),
    bandBelow: Math.round(floor - artBottom - gap), bandAbove: Math.round(artTop - area.top - gap),
    coveredPct: +(covered / total * 100).toFixed(1),
    cardDisplay: getComputedStyle(document.querySelector('.metadata-panel')).display,
    layout: (document.querySelector('#tabLayoutLabel') || {}).textContent,
  });
})()
