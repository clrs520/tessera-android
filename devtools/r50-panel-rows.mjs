(() => {
  const hr = document.getElementById('headerRight');
  const ids = ['sortOrderBtn','autoNextBtn','tapBehaviorChoice','triggerHlBtn','metaDetailBtn'];
  const rows = ids.map(id => {
    const el = document.getElementById(id);
    if (!el) return [id, null, null];
    const r = el.getBoundingClientRect();
    return [id, Math.round(r.left + r.width/2), Math.round(r.top + r.height/2)];
  });
  return JSON.stringify({ open: hr.classList.contains('active'), rows });
})()
