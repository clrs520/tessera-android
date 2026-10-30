(() => { try {
    const vis = [...document.querySelectorAll('.video-container')].filter(c => { const r = c.getBoundingClientRect(); return r.width > 200 && r.top > 0; });
    return JSON.stringify({ shown: vis.map(c => c.dataset.camera), sup: Math.max(0, (viewer.suppressPlayerTapUntil || 0) - Date.now()), lm: document.querySelector('.player-area').className });
} catch (e) { return 'THREW ' + e.message; } })()
