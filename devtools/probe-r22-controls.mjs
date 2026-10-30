// Hit-test every visible phone control: does a tap at its own centre land on it, or on
// something that paints over it?
(() => {
  const sel = '.video-controls-overlay button, #phoneActionBar button, .metadata-panel, .stats-overlay .stats-close';
  const bad = [];
  const ok = [];
  document.querySelectorAll(sel).forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (getComputedStyle(e).display === 'none' || getComputedStyle(e).visibility === 'hidden') return;
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { bad.push({ el: e.id || e.className, off: [Math.round(x), Math.round(y)] }); return; }
    const hit = document.elementFromPoint(x, y);
    if (hit === e || e.contains(hit) || (hit && hit.contains(e))) {
      ok.push((e.id || String(e.className).split(' ')[0]) + ':' + Math.round(r.width) + 'x' + Math.round(r.height));
    } else {
      bad.push({
        el: (e.id || String(e.className).slice(0, 26)) + ':' + (e.textContent || '').trim().slice(0, 8),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        hitBy: hit ? hit.tagName + '.' + String(hit.className).slice(0, 26) + '#' + hit.id : 'null',
      });
    }
  });
  return JSON.stringify({ vw: innerWidth, vh: innerHeight, okCount: ok.length, ok, bad }, null, 1);
})()
