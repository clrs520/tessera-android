(() => {
  const cands = ['#eventSearchCancel','.event-search-cancel','#searchCancel','.search-cancel'];
  for (const s of cands) { const el = document.querySelector(s); if (el) { const r = el.getBoundingClientRect(); return JSON.stringify({s, x: Math.round(r.left+r.width/2), y: Math.round(r.top+r.height/2), t: el.textContent.trim()}); } }
  const row = window.viewer.dom.eventSearchRow;
  const others = [...row.parentElement.children].map(e => [e.id||e.className, Math.round(e.getBoundingClientRect().left+e.getBoundingClientRect().width/2), Math.round(e.getBoundingClientRect().top+e.getBoundingClientRect().height/2), e.textContent.trim().slice(0,6)]);
  return JSON.stringify({ fallback: others });
})()
