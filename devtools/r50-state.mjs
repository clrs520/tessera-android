(() => {
  const q = s => document.querySelector(s);
  const c = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]; };
  const burger = q('#sidebarToggle') || q('.sidebar-toggle') || q('[data-action="toggle-sidebar"]');
  return JSON.stringify({
    theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
    storage: localStorage.getItem('tdashcam.themeMode'),
    navSearch: q('#sidebar')?.classList.contains('nav-search'),
    sidebarOpen: q('#sidebar')?.classList.contains('open'),
    burger: c(burger),
    searchRow: c(q('#eventSearchRow')),
    metaOpen: !!q('.metadata-panel.active, #metadataPanel.active, .pe-body'),
    orientation: window.innerWidth + 'x' + window.innerHeight
  });
})()
