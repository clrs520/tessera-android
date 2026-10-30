(() => {
  const out = [];
  document.querySelectorAll('button, [role=button], .bottom-action-btn, [data-tab]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 12 || r.height < 12) return;
    if (r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && !el.closest('.sidebar.collapsed') && !el.closest('.metadata-panel.collapsed'))
      out.push([el.id || el.className, Math.round(r.left+r.width/2), Math.round(r.top+r.height/2), el.textContent.trim().slice(0,10)]);
  });
  return JSON.stringify(out);
})()
