(() => { try {
    const h = [...document.querySelectorAll('.clip-handle')].map(e => { const r = e.getBoundingClientRect(); return e.className.split(' ')[1] + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom) + '] ta=' + getComputedStyle(e).touchAction; });
    const vc = viewer.videoControls;
    return JSON.stringify({ clipMode: vc && vc.clipModeActive, start: vc && Math.round((vc.clipStartTime || 0) * 10) / 10, end: vc && Math.round((vc.clipEndTime || 0) * 10) / 10, handles: h });
} catch (e) { return 'THREW ' + e.message; } })()
