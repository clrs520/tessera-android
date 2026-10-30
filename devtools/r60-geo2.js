(() => { try {
    const rows = [...document.querySelectorAll('.progress-container, #phoneSpeedBtn, #videoControlsOverlay')]
        .map(e => { const r = e.getBoundingClientRect(); return String(e.id || e.className).split(' ')[0] + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom) + '] op=' + getComputedStyle(e).opacity + ' pe=' + getComputedStyle(e).pointerEvents; });
    const c = document.querySelector('.video-container').getBoundingClientRect();
    return JSON.stringify({ cont: [Math.round(c.left), Math.round(c.top), Math.round(c.right), Math.round(c.bottom)], rows });
} catch (e) { return 'THREW ' + e.message; } })()
