(async () => {
  const v = window.viewer;
  const dead = '/storage/emulated/0/Download/TeslaCam-2';
  const snap = tag => ({
    tag,
    lastScannedPath: v.lastScannedPath,
    allFiles: v.allFiles.length,
    groups: v.eventGroups.length,
    cards: document.querySelectorAll('.file-item').length,
    firstPaths: (v.eventGroups[0] ? JSON.stringify(Object.keys(v.eventGroups[0])) : null),
    sampleCardPath: (() => {
      const c = document.querySelector('.file-item');
      return c ? (c.dataset.path || c.title || '').slice(0, 90) : null;
    })(),
    mediaDir: localStorage.getItem('tdashcam.mediaDir'),
    recent: JSON.parse(localStorage.getItem('tdashcam.recentDirs') || '[]'),
    onChip: (() => { const n = document.querySelector('#recentDirs .recent-chip.on'); return n ? n.dataset.path : null; })(),
    toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.slice(0, 80)),
  });
  const out = [snap('before')];
  try { await v.loadTauriDirectory(dead); } catch (e) { out.push({ threw: String(e).slice(0, 120) }); }
  await new Promise(r => setTimeout(r, 1500));
  out.push(snap('after-dead-scan'));
  return JSON.stringify(out, null, 1);
})()
