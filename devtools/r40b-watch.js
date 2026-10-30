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
        toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()),
        cards: document.querySelectorAll('.event-card').length,
        headerPath: document.querySelector('.path-display, #currentPathLabel')?.textContent?.trim()?.slice(0, 60),
    };
})()
