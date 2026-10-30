(() => {
  const cs = getComputedStyle(document.documentElement);
  const rectOf = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) };
  };
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) };
  };
  const firstVideoCard = document.querySelector('.video-card');
  const grid = document.querySelector('.player-area');
  const overlay = document.querySelector('.video-controls-overlay');
  const vr = overlay ? overlay.getBoundingClientRect() : null;
  const gr = grid ? grid.getBoundingClientRect() : null;
  return JSON.stringify({
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    phoneMediaMatch: matchMedia('(max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px)').matches,
    safe: {
      top: cs.getPropertyValue('--safe-top').trim(),
      bottom: cs.getPropertyValue('--safe-bottom').trim(),
      left: cs.getPropertyValue('--safe-left').trim(),
      right: cs.getPropertyValue('--safe-right').trim(),
    },
    resolvedSafePx: {
      top: parseFloat(getComputedStyle(document.querySelector('.main-header')).paddingTop),
    },
    theme: {
      dark: document.body.classList.contains('dark-theme'),
      colorScheme: cs.colorScheme || getComputedStyle(document.documentElement).colorScheme,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    },
    rects: {
      header: rectOf('.main-header'),
      viewSwitcher: rectOf('#viewSwitcher'),
      controlsOverlay: rectOf('.video-controls-overlay'),
      playerArea: rectOf('#playerArea'),
      sidebar: rectOf('.sidebar'),
      fileList: rectOf('#fileList'),
      sidebarFooter: rectOf('.sidebar-footer'),
      overlayScrim: rectOf('.overlay'),
      scrimActive: document.querySelector('.overlay')?.classList.contains('active'),
    },
    sizes: {
      controlBtn: box(document.querySelector('#playPauseBtn')),
      viewBtn: box(document.querySelector('.view-btn')),
      headerMenuBtn: box(document.querySelector('#headerMenuBtn')),
      openSidebarBtn: box(document.querySelector('#openSidebarBtn')),
      selectFolderBtn: box(document.querySelector('#selectFolderBtn')),
      dateFilter: box(document.querySelector('#dateFilter')),
      videoCard: box(firstVideoCard),
      progressTrack: box(document.querySelector('#progressBar')),
    },
    gridOverflow: vr && gr ? Math.round(gr.bottom - vr.top) : null,
    list: { cards: document.querySelectorAll('.video-card').length, files: (window.viewer && window.viewer.allFiles || []).length },
    backLayer: {
        count: window.viewer && typeof window.viewer.phoneLayerCount === 'function' ? window.viewer.phoneLayerCount() : null,
        native: !!window.TDashcamNative,
    },
  }, null, 2);
})()
