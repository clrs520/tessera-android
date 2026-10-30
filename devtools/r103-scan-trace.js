// R103 · loadTauriDirectory returns in <1s and no cards appear. Which of its three steps is empty?
(async () => {
    const v = window.viewer;
    const dir = localStorage.getItem('tdashcam.mediaDir');
    const log = [];
    const t = () => Date.now();
    try {
        const s = t();
        await ensureMediaServer();
        log.push(`ensureMediaServer ok in ${t() - s}ms`);
    } catch (e) { log.push('ensureMediaServer THREW ' + e.message); }
    try {
        const s = t();
        const files = await Promise.race([v.nativeScanFiles(dir),
            new Promise((_, rej) => setTimeout(() => rej(new Error('scan TIMEOUT')), 45000))]);
        log.push(`nativeScanFiles n=${files.length} in ${t() - s}ms`);
        log.push('sample=' + files.slice(0, 3).map((f) => `${(f.webkitRelativePath || f.name || '?').slice(0, 46)}:${f.size}`).join(' | '));
        const subs = new Set(files.map((f) => String(f.webkitRelativePath || '').split('/')[0]));
        log.push('topDirs=' + [...subs].slice(0, 6).join(','));
    } catch (e) { log.push('nativeScanFiles THREW: ' + e.message); }
    try {
        log.push('perm=' + JSON.stringify(await (typeof requestAllFilesAccess === 'function' ? Promise.race([Promise.resolve('fn'), new Promise((r) => setTimeout(() => r('?'), 3000))]) : 'nofn')).slice(0, 60));
    } catch (e) { log.push('perm err ' + e.message); }
    try {
        const st = await window.__tesseraNativeState;
        log.push('nativeState=' + JSON.stringify(st || null).replace(/\/storage\/emulated\/0/g, '<FIX>').slice(0, 200));
    } catch (e) { log.push('nativeState err ' + e.message); }
    log.push(`lastScannedPath=${String(v.lastScannedPath || '-').replace(/^\/storage\/emulated\/0/, '<FIX>')} groups=${(v.eventGroups || []).length} cards=${document.querySelectorAll('.event-card').length}`);
    return JSON.stringify({ log }, null, 1);
})()
