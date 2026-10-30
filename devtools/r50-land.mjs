(() => {
  const c = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; };
  const v = window.viewer;
  return JSON.stringify({
    sidebar: v.dom.sidebar.className,
    row: c(v.dom.eventSearchRow),
    title: c(v.dom.sidebar.querySelector('.header-title')),
    tabs: ['tabListBtn','tabFolderBtn','tabLayoutBtn','tabRefreshBtn','tabMoreBtn'].map(id => [id, ...c(document.getElementById(id))])
  });
})()
