(async () => {
  const v = window.viewer;
  let sub = null;
  try { const r = await window.TDashcamNative ? null : null; } catch (e) {}
  const payload = await (async () => {
    try { return await nativeGetVolumes(); } catch (e) { return { err: String(e).slice(0, 80) }; }
  })();
  return JSON.stringify({
    lastScannedPath: v?.lastScannedPath,
    files: v?.allFiles?.length, groups: v?.eventGroups?.length,
    mediaDir: localStorage.getItem('tdashcam.mediaDir'),
    recentLS: JSON.parse(localStorage.getItem('tdashcam.recentDirs') || '[]'),
    chips: [...document.querySelectorAll('#recentDirs .recent-chip')].map(c => c.dataset.path + (c.classList.contains('on') ? '*' : '')),
    toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.slice(0, 140)),
    emptyHero: !!document.querySelector('.empty-hero') && getComputedStyle(document.querySelector('.empty-hero')).display,
  }, null, 1);
})()
