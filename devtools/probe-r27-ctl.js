(() => {
  const out = {};
  for (const id of ['clipBtn', 'confirmClipBtn', 'fullscreenBtn', 'peStartBtn', 'peEndInput', 'peSummary']) {
    const e = document.getElementById(id);
    if (!e) { out[id] = null; continue; }
    const b = e.getBoundingClientRect();
    out[id] = { x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2), disp: getComputedStyle(e).display, vis: getComputedStyle(e).visibility };
  }
  out.overlay = document.querySelector('.video-controls-overlay')?.classList.contains('show');
  out.event = (window.viewer?.currentEvent?.eventId) || null;
  return JSON.stringify(out);
})()
