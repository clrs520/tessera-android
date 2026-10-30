(() => {
  const v = window.viewer;
  return JSON.stringify({
    nativeBridge: !!window.TDashcamNative,
    hasHandler: typeof window.__tdashcamCloseTopLayer === 'function',
    reported: v ? v.reportedLayerCount : null,
    computed: v ? v.phoneLayerCount() : null,
    phoneLayout: isPhoneLayoutFn(),
    state: {
        sidebarOpen: !document.querySelector('.sidebar').classList.contains('collapsed'),
        scrimActive: document.querySelector('.overlay').classList.contains('active'),
        headerMenuOpen: document.getElementById('headerRight').classList.contains('active'),
        openModals: Array.from(document.querySelectorAll('.modal-overlay.show')).map(m => m.id),
    },
    theme: {
        dark: document.body.classList.contains('dark-theme'),
        rootColorScheme: getComputedStyle(document.documentElement).colorScheme,
        bodyColorScheme: getComputedStyle(document.body).colorScheme,
    },
  }, null, 2);

  function isPhoneLayoutFn() {
    return matchMedia('(max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px)').matches;
  }
})()
