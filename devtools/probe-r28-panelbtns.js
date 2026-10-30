(() => {
  const g = document.getElementById('headerActionsGroup');
  const out = [];
  [...g.querySelectorAll('button')].forEach(b => {
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    out.push({
      id: b.id || b.className,
      title: (b.title || '').slice(0, 20),
      disp: cs.display,
      vis: cs.visibility,
      dis: !!b.disabled,
      op: cs.opacity,
      w: Math.round(r.width),
      aria: b.getAttribute('aria-label') || ''
    });
  });
  return JSON.stringify({ playing: viewer.multiCameraPlayer.isPlaying, n: out.length, out }, null, 1);
})()
