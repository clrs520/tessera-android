(() => {
  const b = document.getElementById('fullscreenBtn');
  const r = b.getBoundingClientRect();
  return JSON.stringify({ vis: getComputedStyle(b).visibility, x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) });
})()
