(() => {
  const v = document.querySelector('video');
  const c = document.createElement('canvas'); c.width = 64; c.height = 36;
  const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0, 64, 36);
  const d = ctx.getImageData(0, 0, 64, 36).data;
  let s = 0, mx = 0;
  for (let i = 0; i < d.length; i += 4) { const l = 0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; s += l; if (l > mx) mx = l; }
  return JSON.stringify({ paused: v.paused, t: +v.currentTime.toFixed(2), dur: +v.duration.toFixed(1),
    vw: v.videoWidth, vh: v.videoHeight, meanLum: Math.round(s/(64*36)), maxLum: Math.round(mx), src: (v.src||'').slice(0,60) });
})()
