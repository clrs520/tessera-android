(() => {
  const v = window.viewer;
  v.dom.sidebar.classList.remove('collapsed');
  const c = document.querySelector('#fileList .video-card');
  const r = c.getBoundingClientRect();
  return JSON.stringify({ collapsed: v.dom.sidebar.classList.contains('collapsed'),
    card: c.textContent.trim().slice(0, 24), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) });
})()
