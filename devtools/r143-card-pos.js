(async () => {
  await new Promise(r => setTimeout(r, 600));
  const c = document.querySelector('#fileList .video-card');
  const r = c.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
    w: Math.round(r.width), text: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) });
})()
