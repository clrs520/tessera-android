(() => { try {
    const pc = document.querySelector('.progress-container');
    const vs = [...document.querySelectorAll('video')].filter(e => e.src && isFinite(e.duration));
    const b = [...document.querySelectorAll('div')].find(d => /time-preview|seek|bubble/i.test(d.className || ''));
    return JSON.stringify({
        now: pc.getAttribute('aria-valuenow'),
        bubble: b ? (b.textContent || '').trim().slice(0, 18) + '/' + b.className : 'none',
        vids: vs.map(e => { const c = e.closest('.video-container'); return { cam: c && c.dataset.camera, t: Math.round(e.currentTime * 10) / 10, d: Math.round(e.duration), paused: e.paused }; }),
    });
} catch (e) { return 'THREW ' + e.message; } })()
