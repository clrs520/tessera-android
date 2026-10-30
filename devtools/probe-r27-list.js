(() => {
  const v = window.viewer || {};
  const raw = v.eventGroups;
  const groups = raw ? (Array.isArray(raw) ? raw : (raw.values ? [...raw.values()] : Object.values(raw))) : [];
  const asArr = (x) => Array.isArray(x) ? x : (x && x.values ? [...x.values()] : Object.values(x || {}));
  const evs = asArr(v.lastFilteredEvents).length ? asArr(v.lastFilteredEvents) : asArr(v.allEvents).length ? asArr(v.allEvents) : asArr(v.events);
  const pick = (e) => ({ id: String(e.eventId || e.id || '').slice(-34), type: e.eventType, city: e.city || null, street: e.street || null, segs: (asArr(e.segments)).length });
  return JSON.stringify({
    mediaDir: localStorage.getItem('tdashcam.mediaDir'),
    groupCount: groups.length,
    groups: groups.slice(0, 20).map(g => Array.isArray(g) ? { k: String(g[0] || '').slice(-30), n: g.length } : pick(g)),
    filtered: evs.length,
    events: evs.slice(0, 20).map(pick),
    allKeys: Object.keys(v).filter(k => /event|group/i.test(k)),
  }, null, 1);
})()
