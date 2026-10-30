(() => {
  const v = window.viewer;
  return JSON.stringify({
    ver: document.getElementById('aboutVersionValue')?.textContent || null,
    chips: [...document.querySelectorAll('#recentDirs .recent-chip')].map(c => c.dataset.path),
    recentLS: JSON.parse(localStorage.getItem('tdashcam.recentDirs') || '[]'),
    mediaDir: localStorage.getItem('tdashcam.mediaDir'),
    lastScannedPath: v?.lastScannedPath,
    files: v?.allFiles?.length, groups: v?.eventGroups?.length,
    toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.slice(0, 120)),
    wrapStyle: document.getElementById('recentDirs')?.style.display,
  }, null, 1);
})()
