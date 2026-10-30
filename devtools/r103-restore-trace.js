// R103 · The AVD boots onto "no folder selected" even though tdashcam.mediaDir is set.
// Walk the restore path one step at a time so the failure names itself instead of being guessed at.
(async () => {
    const v = window.viewer;
    const dir = localStorage.getItem('tdashcam.mediaDir');
    const log = [];
    const t0 = Date.now();
    const el = (ms) => `${Math.round(ms)}ms`;
    log.push(`dir=${dir ? dir.replace(/^\/storage\/emulated\/0/, '<FIX>') : 'NULL'}`);
    log.push(`isTauri=${v && v.isTauri} touch=${typeof isTouchShellRuntime === 'function' ? isTouchShellRuntime() : 'nofn'}`);
    if (!v) return JSON.stringify({ log, fatal: 'no viewer' });
    let gone = null;
    try {
        const p = v.scannedPathGone(dir);
        gone = await Promise.race([p, new Promise((r) => setTimeout(() => r('TIMEOUT'), 20000))]);
        log.push(`scannedPathGone=${gone} in ${el(Date.now() - t0)}`);
    } catch (e) { log.push('scannedPathGone THREW ' + e.message); }
    const t1 = Date.now();
    try {
        const p = v.loadTauriDirectory(dir);
        const r = await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('loadTauriDirectory TIMEOUT')), 60000))]);
        log.push(`loadTauriDirectory resolved ${typeof r} in ${el(Date.now() - t1)}`);
    } catch (e) { log.push(`loadTauriDirectory THREW after ${el(Date.now() - t1)}: ${e.message}`); }
    for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        const n = document.querySelectorAll('.event-card').length;
        if (n) { log.push(`cards=${n} after ${el(Date.now() - t1)}`); break; }
        if (i === 11) log.push('cards=0 still after 30s');
    }
    log.push(`events=${(v.videoData && v.videoData.length) ?? (v.allEvents && v.allEvents.length) ?? '?'} scanErr=${String(v.lastScanError || '-').slice(0, 80)}`);
    log.push(`emptyHero=${((document.querySelector('.empty-hero') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}`);
    return JSON.stringify({ log }, null, 1);
})()
