(() => {
  const v = window.viewer;
  const sb = v.dom.sidebar;
  const row = v.dom.eventSearchRow;
  const rr = row.getBoundingClientRect();
  const tr = sb.querySelector('.header-title').getBoundingClientRect();
  const chips = sb.querySelector('.date-chips');
  const first = document.querySelector('[data-event-id]');
  const cs = getComputedStyle(row);
  return JSON.stringify({
    navSearch: sb.classList.contains('nav-search'),
    shift: sb.style.getPropertyValue('--nav-shift'),
    rowMidY: Math.round(rr.top + rr.height/2), titleMidY: Math.round(tr.top + tr.height/2),
    off: Math.round((rr.top+rr.height/2) - (tr.top+tr.height/2)),
    chipsDisplay: chips ? getComputedStyle(chips).display : null,
    rowMarginBottom: cs.marginBottom, rowTransform: cs.transform,
    firstTop: first ? Math.round(first.getBoundingClientRect().top) : null,
    focus: document.activeElement === v.dom.eventSearch
  });
})()
