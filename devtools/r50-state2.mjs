(() => {
  const c = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2), Math.round(r.width), Math.round(r.height)]; };
  const v = window.viewer;
  const row = v?.dom?.eventSearchRow;
  const burger = document.querySelector('#sidebarToggle, .sidebar-toggle, #menuToggle, .hamburger');
  const meta = document.querySelector('.metadata-panel, #metadataPanel, .pe-body');
  const closeBtn = document.querySelector('.metadata-panel .close, #metadataClose, .pe-close');
  return JSON.stringify({
    navSearch: v?.dom?.sidebar?.classList.contains('nav-search'),
    sidebarClasses: v?.dom?.sidebar?.className,
    row: c(row),
    burgerId: burger?.id + '/' + burger?.className,
    burger: c(burger),
    metaClass: meta?.className,
    close: c(closeBtn),
    listTop: (() => { const li = document.querySelector('.event-item'); if (!li) return null; return Math.round(li.getBoundingClientRect().top); })()
  });
})()
