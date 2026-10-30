(async () => {
  const v = document.querySelector('video');
  try { await v.play(); } catch (e) { return JSON.stringify({ err: String(e) }); }
  await new Promise(r => setTimeout(r, 1500));
  return JSON.stringify({ paused: v.paused, t: +v.currentTime.toFixed(2) });
})()
