(async () => {
    const v = window.viewer;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('tdashcam.recentDirs') || '[]'); } catch (e) { recent = ['<bad>']; }
    const probe = await nativeInvoke('probe_readable', { path: '/storage/0000-0000/TeslaCam' });
    const payload = await getStorageVolumes(true);
    return {
        files: v?.allFiles?.length ?? -1,
        groups: v?.eventGroups?.length ?? -1,
        lastScanned: v?.lastScannedPath,
        mediaDir: localStorage.getItem('tdashcam.mediaDir'),
        recentDirs: recent,
        cards: document.querySelectorAll('.event-card').length,
        toasts: [...document.querySelectorAll('.toast')].map(t => t.textContent.trim()),
        stickProbe: probe,
        volumes: (payload?.volumes || []).map(x => `${x.path}|${x.kind}|count=${window.volumeEntries(x)}`),
    };
})()
