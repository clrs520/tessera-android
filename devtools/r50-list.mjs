(() => {
  const sel = ['.event-card','.event-item','.sidebar .event','.event-list','[data-event-id]','.empty-state'];
  const out = sel.map(s => { const n = document.querySelectorAll(s).length; const el = document.querySelector(s); return [s, n, el ? Math.round(el.getBoundingClientRect().top) : null]; });
  return JSON.stringify({ counts: out, evCount: window.viewer?.events?.length, filtered: window.viewer?.filteredEvents?.length });
})()
