(async () => {
  const path = '/storage/emulated/0/Download/TDashcam_2026-10-06_14-20-00_1c_880x1968.mp4';
  const playing = [...document.querySelectorAll('video')].map(v => v.src).find(s => /\/media\//.test(s));
  if (!playing) return { err: 'no playing video for token' };
  const m = playing.match(/\/media\/([^/]+)\//);
  const token = m && m[1];
  const b64 = btoa(unescape(encodeURIComponent(path))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = playing.replace(/\/media\/[^/]+\/.*$/, '/media/' + token + '/' + b64);
  const vid = document.createElement('video');
  vid.crossOrigin = 'anonymous'; vid.muted = true; vid.style.cssText = 'position:fixed;left:-9999px;width:64px;height:64px';
  document.body.appendChild(vid);
  vid.src = url;
  await new Promise((res, rej) => { vid.onloadedmetadata = res; vid.onerror = () => rej(new Error('load err ' + vid.error.code)); setTimeout(res, 6000); });
  const meta = { w: vid.videoWidth, h: vid.videoHeight, dur: vid.duration };
  try { await vid.play(); } catch (e) { }
  await new Promise(r => setTimeout(r, 1200));
  vid.pause();
  const c = document.createElement('canvas');
  c.width = 64; c.height = Math.round(64 * meta.h / meta.w) || 64;
  const ctx = c.getContext('2d');
  ctx.drawImage(vid, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let sum = 0, blackRows = 0;
  const rowLum = [];
  for (let y = 0; y < c.height; y++) {
    let rs = 0;
    for (let x = 0; x < c.width; x++) { const i = (y * c.width + x) * 4; rs += 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]; }
    const lv = rs / c.width; rowLum.push(Math.round(lv)); sum += lv;
    if (lv < 3) blackRows++;
  }
  vid.remove();
  return { meta, aspect: +(meta.w / meta.h).toFixed(4), meanLum: Math.round(sum / c.height),
           topRows: rowLum.slice(0, 4), bottomRows: rowLum.slice(-4), blackRows, canvasH: c.height, urlOk: true };
})()
