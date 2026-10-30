(() => { try {
    const v = [...document.querySelectorAll('video')].filter(e => e.src).map(e => ({ p: e.paused, r: e.playbackRate }));
    return JSON.stringify({ hint: document.getElementById('phoneBoostHint').classList.contains('show'), val: document.getElementById('phoneBoostValue').textContent, vids: v.slice(0, 3) });
} catch (e) { return 'THREW ' + e.message; } })()
