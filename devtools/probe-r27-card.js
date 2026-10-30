(() => {
  const c = [...document.querySelectorAll('[data-event-id]')].find(x => /07-41-59/.test(x.dataset.eventId));
  if (!c) return JSON.stringify({ err: 'card not found', all: [...document.querySelectorAll('[data-event-id]')].map(x => x.dataset.eventId.slice(-20)) });
  const r = c.getBoundingClientRect();
  return JSON.stringify({ t: c.textContent.trim().replace(/\s+/g,' ').slice(0,60), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], center: [Math.round(r.x + r.width/2), Math.round(r.y + r.height/2)], vp: [innerWidth, innerHeight] });
})()
