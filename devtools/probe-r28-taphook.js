(() => {
  window.__taplog = [];
  if (!window.__tapHooked) {
    window.__tapHooked = true;
    document.addEventListener('click', e => {
      const b = e.target.closest ? e.target.closest('button') : null;
      window.__taplog.push((b ? (b.id || b.className) : e.target.tagName) + '@' + Math.round(e.clientX) + ',' + Math.round(e.clientY));
    }, true);
  }
  return 'hooked';
})()
