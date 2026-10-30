(() => {
const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    w: Math.round(r.width), h: Math.round(r.height),
    x: Math.round(r.left), y: Math.round(r.top),
    disp: cs.display, vis: cs.visibility, op: cs.opacity, pe: cs.pointerEvents,
  };
};
const q = (s) => document.querySelector(s);
const out = {
  vp: [innerWidth, innerHeight],
  orient: matchMedia('(orientation: landscape)').matches ? 'land' : 'port',
  body: document.body.className,
  sidebarOpen: !document.body.classList.contains('sidebar-collapsed'),
  headerRightActive: q('#headerRight') ? q('#headerRight').className : null,
  overlay: rect(q('.video-controls-overlay')),
  controlsRight: rect(q('.controls-right')),
  fs: rect(q('#fullscreenBtn')),
  fsDisabled: q('#fullscreenBtn') ? q('#fullscreenBtn').disabled : null,
  clip: rect(q('#clipBtn')),
  speed: rect(q('#speedControl')),
  filters: rect(q('.filters')),
  filterGroups: [...document.querySelectorAll('.filters .filter-group')].map((e) => ({
    cls: e.className, label: e.querySelector('label') && e.querySelector('label').textContent, ctl: rect(e.querySelector('input,select')),
  })),
  typeSeg: rect(q('#typeSeg')),
  typeSegBtns: [...document.querySelectorAll('.type-seg-btn')].map((e) => rect(e)),
  quickFilters: rect(q('#quickFilters')),
  search: rect(q('#eventSearch')),
  chips: [...document.querySelectorAll('.date-chips .date-chip')].slice(0, 3).map((e) => rect(e)),
  recentDirs: rect(q('#recentDirs')),
  footer: rect(q('.sidebar-footer')),
  selectFolder: rect(q('#selectFolderBtn')),
  appVersion: rect(q('#appVersion')),
  appVersionText: q('#appVersion') ? q('#appVersion').textContent : null,
  githubRow: rect(q('.github-link')),
  fieldH: getComputedStyle(q('.sidebar')).getPropertyValue('--field-h'),
  gutter: getComputedStyle(q('.sidebar')).getPropertyValue('--gutter'),
  cards: document.querySelectorAll('.video-card').length,
};
  return JSON.stringify(out, null, 1);
})();
