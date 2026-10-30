(() => {
  const v = window.viewer;
  const rows = v.eventGroups.map(g => ({ id: g.eventId.split('/').pop(), segs: (g.segments || []).length,
    noFront: (g.segments || []).filter(s => !s.files || !s.files.front).length }))
    .filter(r => r.segs > 1);
  return JSON.stringify({ multi: rows.slice(0, 6), total: rows.length });
})()
