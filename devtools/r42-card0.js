(() => {
  const c = document.querySelector('.video-card, .event-card, [data-event-id]');
  if (!c) return 'NO CARD';
  const r = c.getBoundingClientRect();
  return JSON.stringify({cls: c.className, x: Math.round((r.left+r.width/2)*devicePixelRatio), y: Math.round((r.top+Math.min(r.height/2,60))*devicePixelRatio)});
})()
