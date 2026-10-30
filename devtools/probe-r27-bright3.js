(async () => {
  const hud = document.getElementById('phoneBrightnessHud');
  const dim = document.getElementById('phoneBrightnessDim');
  const seen = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 6000) {
    const d = getComputedStyle(hud).display;
    if (d !== 'none') {
      const r = hud.getBoundingClientRect();
      seen.push({ t: Date.now() - t0, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        value: document.getElementById('phoneBrightnessValue').textContent,
        fill: document.getElementById('phoneBrightnessFill').style.width,
        dim: getComputedStyle(dim).opacity });
      if (seen.length > 12) break;
    }
    await new Promise(r => setTimeout(r, 60));
  }
  return JSON.stringify({ samples: seen.length, first: seen[0] || null, last: seen[seen.length - 1] || null });
})()
