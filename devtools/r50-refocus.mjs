(() => {
  const v = window.viewer;
  v.dom.eventSearch.blur();
  void v.dom.eventSearch.offsetHeight;
  v.dom.eventSearch.focus();
  const sb = v.dom.sidebar;
  const row = v.dom.eventSearchRow;
  const rr = row.getBoundingClientRect();
  const tr = sb.querySelector('.header-title').getBoundingClientRect();
  return JSON.stringify({
    navSearch: sb.classList.contains('nav-search'),
    shift: sb.style.getPropertyValue('--nav-shift'),
    off: Math.round((rr.top+rr.height/2)-(tr.top+tr.height/2)),
    rowH: Math.round(rr.height), rowMidY: Math.round(rr.top+rr.height/2), titleMidY: Math.round(tr.top+tr.height/2),
    firstTop: Math.round(document.querySelector('[data-event-id]').getBoundingClientRect().top)
  });
})()
