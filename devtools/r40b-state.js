(() => {
    const v = window.viewer;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('tdashcam.recentDirs') || '[]'); } catch (e) { recent = ['<bad>']; }
    return {
        t: new Date().toISOString().slice(11, 19),
        files: v?.allFiles?.length ?? -1,
        groups: v?.eventGroups?.length ?? -1,
        lastScanned: v?.lastScannedPath,
        mediaDir: localStorage.getItem('tdashcam.mediaDir'),
        recentDirs: recent,
        cards: document.querySelectorAll('.event-card').length,
        toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()),
        chipPaths: [...document.querySelectorAll('.dir-volume-chip')].map(c => ({
            p: c.dataset.path, off: c.disabled, cls: c.className
        })),
        counts: Object.fromEntries([...(v?.volumeEntryCounts instanceof Map ? v.volumeEntryCounts : [])]),
        goneCard: document.getElementById('androidDirHint')?.classList?.contains('hidden') === false,
    };
})()
