(() => {
  const c = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; };
  const v = window.viewer;
  const li = document.querySelector('.event-item');
  return JSON.stringify({
    sidebar: v.dom.sidebar.className,
    navSearch: v.dom.sidebar.classList.contains('nav-search'),
    searchRow: c(v.dom.eventSearchRow),
    headerTitle: c(v.dom.sidebar.querySelector('.header-title')),
    listTop: li ? Math.round(li.getBoundingClientRect().top) : null
  });
})()
