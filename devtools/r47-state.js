(() => {
    const ids = ['androidDirModal', 'aboutModal', 'filePathModal', 'phoneExportModal', 'deleteConfirmModal'];
    const out = { sheets: {} };
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) { out.sheets[id] = 'missing'; return; }
        out.sheets[id] = el.classList.contains('show') ? 'open'
            : (el.style.display !== 'none' ? 'closing' : 'closed');
    });
    out.classes = document.documentElement.className;
    const peg = document.querySelector('#phoneExportModal .sheet-grabber');
    out.peGrabber = peg ? getComputedStyle(peg).display : 'missing';
    const ppanel = document.querySelector('#phoneExportModal .modal-content');
    out.peInlineTransform = ppanel ? (ppanel.style.transform || '-') : 'missing';
    const tr = ppanel ? ppanel.getBoundingClientRect() : null;
    out.peRect = tr ? [Math.round(tr.left), Math.round(tr.top), Math.round(tr.width), Math.round(tr.height)] : null;
    out.peJob = !!(window.viewer && window.viewer.peJob);
    out.mediaDir = localStorage.getItem('tdashcam.mediaDir') || '';
    out.events = window.viewer && window.viewer.eventGroups ? window.viewer.eventGroups.length : -1;
    out.error = window.__tdashcamLastError || '';
    return JSON.stringify(out);
})()
