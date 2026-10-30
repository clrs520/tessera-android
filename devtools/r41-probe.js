(() => {
    const v = window.viewer, vc = v.videoControls;
    if (!window.__vib) {
        window.__vib = [];
        const orig = navigator.vibrate ? navigator.vibrate.bind(navigator) : null;
        navigator.vibrate = (p) => { window.__vib.push(p); return orig ? orig(p) : true; };
    }
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round((b.left + b.width / 2) * devicePixelRatio), y: Math.round((b.top + b.height / 2) * devicePixelRatio), l: Math.round(b.left * 100) / 100, w: Math.round(b.width * 100) / 100, h: Math.round(b.height * 100) / 100 }; };
    return JSON.stringify({
        ver: v.appVersion,
        cur: v.currentEvent?.id,
        totalDur: vc.totalDuration,
        span: vc.speedGraphSpan,
        graphCls: vc.speedGraphContainer.className,
        graphRect: r(vc.speedGraphContainer),
        timeTxt: vc.videoTimeDisplay?.textContent,
        aria: document.getElementById('progressContainer').getAttribute('aria-valuenow'),
        playing: v.continuousPlayer?.isPlaying,
        view: document.querySelector('.video-list-section')?.offsetParent ? 'list' : 'player',
        cards: document.querySelectorAll('.video-card').length,
        vib: window.__vib,
        dpr: devicePixelRatio,
    }, null, 1);
})()
