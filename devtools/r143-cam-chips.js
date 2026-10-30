(() => {
  const nodes = [...document.querySelectorAll('[data-camera]')];
  return JSON.stringify(nodes.map(n => ({ tag: n.tagName, cls: String(n.className).slice(0, 34),
    cam: n.dataset.camera, sel: n.getAttribute('aria-selected'), txt: n.textContent.trim().slice(0, 8),
    vis: n.getBoundingClientRect().width > 0 })));
})()
