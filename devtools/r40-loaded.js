(() => {
  const v = window.viewer;
  return JSON.stringify({
    lastScannedPath: v?.lastScannedPath,
    files: v?.allFiles?.length, groups: v?.eventGroups?.length,
    firstEvent: v?.eventGroups?.[0]?.eventId || null,
    mediaDir: localStorage.getItem('tdashcam.mediaDir'),
    chips: [...document.querySelectorAll('#recentDirs .recent-chip')].map(c => c.dataset.path + (c.classList.contains('on') ? '*' : '')),
    cards: [...document.querySelectorAll('.file-item')].slice(0, 3).map(c => c.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)),
    toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.slice(0, 120)),
  }, null, 1);
})()
