// Measure each cell of a composite export separately: per-cell content box, the black bars
// around it, and the resulting aspect. Real Tesla footage is 1.5437 (2896x1876 / 1448x938);
// a squashed cell reads ~2.3 or ~0.9 instead of 1.54.
(async () => {
  const ROWS = 2, COLS = 3;
  const SRC = 1.5437;
  const path = '/storage/emulated/0/Download/TDashcam_2026-10-08_07-30-59_6c_1696x736.mp4';
  const playing = [...document.querySelectorAll('video')].map(v => v.src).find(s => /\/media\//.test(s));
  if (!playing) return JSON.stringify({ err: 'no playing video for token' });
  const token = playing.match(/\/media\/([^/]+)\//)[1];
  const b64 = (p) => btoa(unescape(encodeURIComponent(p))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const base = playing.replace(/\/media\/[^/]+\/.*$/, '/media/' + token + '/');

  const vid = document.createElement('video');
  vid.crossOrigin = 'anonymous'; vid.muted = true;
  vid.style.cssText = 'position:fixed;left:-9999px;width:64px;height:64px';
  document.body.appendChild(vid);
  vid.src = base + b64(path);
  const meta = await new Promise((res) => {
    vid.onloadedmetadata = () => res({ w: vid.videoWidth, h: vid.videoHeight, dur: +vid.duration.toFixed(2) });
    vid.onerror = () => res({ err: 'load ' + vid.error.code });
    setTimeout(() => res({ err: 'timeout' }), 12000);
  });
  if (meta.err) { vid.remove(); return JSON.stringify(meta); }
  vid.currentTime = Math.min(2.0, meta.dur / 2);
  await new Promise(r => setTimeout(r, 300));
  try { await vid.play(); } catch (e) { }
  await new Promise(r => setTimeout(r, 1400));
  vid.pause();
  const c = document.createElement('canvas');
  c.width = meta.w; c.height = meta.h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(vid, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const lumAt = (x, y) => { const i = (y * c.width + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };

  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let col = 0; col < COLS; col++) {
      const x0 = Math.floor(col * meta.w / COLS), x1 = Math.floor((col + 1) * meta.w / COLS);
      const y0 = Math.floor(r * meta.h / ROWS), y1 = Math.floor((r + 1) * meta.h / ROWS);
      const cw = x1 - x0, ch = y1 - y0;
      // Mean absolute luminance difference along a line. A pure-black band reads ~0, so a
      // legitimately dark picture row is not mistaken for a letterbox band.
      const lineVar = (count, get) => {
        let prev = -1, diff = 0;
        for (let k = 0; k < count; k++) {
          const l = get(k);
          if (prev >= 0) diff += Math.abs(l - prev);
          prev = l;
        }
        return diff / count;
      };
      const rows = [], colsArr = [];
      for (let y = 0; y < ch; y++) rows.push(lineVar(cw, (k) => lumAt(x0 + k, y0 + y)));
      for (let x = 0; x < cw; x++) colsArr.push(lineVar(ch, (k) => lumAt(x0 + x, y0 + k)));
      const box = (a) => {
        const thr = 0.6;
        const f = a.findIndex(v => v > thr);
        const l = a.length - 1 - [...a].reverse().findIndex(v => v > thr);
        return f < 0 ? { first: -1, last: -1 } : { first: f, last: l };
      };
      const rb = box(rows), cb = box(colsArr);
      const bw = cb.last - cb.first + 1, bh = rb.last - rb.first + 1;
      const aspect = bh > 0 ? bw / bh : null;
      cells.push({
        cell: `${r + 1}-${col + 1}`,
        cellSize: `${cw}x${ch}`,
        box: bh > 0 ? `${bw}x${bh}` : 'empty',
        bars: { t: rb.first, b: ch - 1 - rb.last, l: cb.first, r: cw - 1 - cb.last },
        aspect: aspect ? Math.round(aspect * 10000) / 10000 : null,
        devPct: aspect ? Math.round(Math.abs(aspect - SRC) / SRC * 10000) / 100 : null,
        fillPct: bh > 0 ? Math.round(bw * bh / (cw * ch) * 10000) / 100 : null,
      });
    }
  }
  vid.remove();
  return JSON.stringify({
    file: path.split('/').pop(),
    frame: `${meta.w}x${meta.h}`,
    frameAspect: Math.round(meta.w / meta.h * 10000) / 10000,
    sourceAspect: SRC,
    maxDevPct: Math.max(...cells.map(x => x.devPct ?? 999)),
    cells,
  }, null, 1);
})()
