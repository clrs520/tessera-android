(() => {
  const cand = [...document.querySelectorAll('button,[role="button"],a,span,div')].filter(e => {
    const t = (e.textContent || '').trim();
    return /详细数据|行车数据|More|更多/.test(t) && t.length < 12;
  }).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return { tag: e.tagName.toLowerCase(), id: e.id, cls: (e.className||'').toString().slice(0,34), txt: e.textContent.trim(),
      x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: Math.round(r.width), h: Math.round(r.height),
      disp: cs.display, vis: cs.visibility, pe: cs.pointerEvents };
  }).filter(e => e.disp !== 'none' && e.w > 0);
  return JSON.stringify(cand, null, 1);
})()
