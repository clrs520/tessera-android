(() => {
  const v = window.viewer;
  const ev = v.eventGroups.find(g => (g.segments || []).length >= 2);
  if (!ev) return JSON.stringify({ error: 'no multi-segment event', counts: v.eventGroups.map(g => (g.segments || []).length) });
  const seg = ev.segments[1];
  return JSON.stringify({
    eventId: ev.eventId,
    segments: ev.segments.length,
    seg1Files: Object.keys(seg.files || {}).filter(k => seg.files[k]),
    seg1Front: seg.files.front || null,
  });
})()
