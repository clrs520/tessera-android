// Pre-build check of the R68 fix: install, in the live page, the synchronous release the new
// resize handler does. Capture-phase so it runs before the app's own listener.
(() => {
    const p = document.getElementById('metadataPanel');
    const m = viewer.metadataManager;
    if (!p || !m) return 'NO_TARGET';
    window.__r68patched = true;
    window.addEventListener('resize', () => {
        if (m.hudFoldAvailable()) return;
        if (!m.hudTouchGeom) return;
        p.style.left = '';
        p.style.top = '';
        p.classList.remove('is-moved');
        m.hudTouchGeom = false;
    }, true);
    return 'PATCHED inline=' + (p.getAttribute('style') || '-');
})()
