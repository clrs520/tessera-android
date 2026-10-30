(() => {
  const out = {};
  const grab = (key, sel) => { const e = typeof sel === 'string' ? document.querySelector(sel) : sel; if (!e) return; const b = e.getBoundingClientRect(); out[key] = { x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2), w: Math.round(b.width), h: Math.round(b.height) }; };
  grab('list', '#tabListBtn');
  const cards = [...document.querySelectorAll('[data-event-id]')];
  out.cardCount = cards.length;
  out.wanted = cards.map(c => { const b = c.getBoundingClientRect(); return { id: c.dataset.eventId, x: Math.round(b.x+b.width/2), y: Math.round(b.y+b.height/2) }; }).filter(c => /07-30-59|07-41-59/.test(c.id));
  return JSON.stringify(out);
})()
