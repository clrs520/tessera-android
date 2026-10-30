(() => { try {
    const v = [...document.querySelectorAll('video')].filter(e => e.src)[0];
    const bubble = document.querySelector('.seek-bubble, #seekBubble, .progress-bubble');
    return JSON.stringify({ t: v && Math.round(v.currentTime * 10) / 10, dur: v && Math.round(v.duration), paused: v && v.paused, bubble: bubble ? (bubble.textContent || '').slice(0, 20) + '/' + bubble.className : 'none' });
} catch (e) { return 'THREW ' + e.message; } })()
