(() => {
    const v = window.viewer, vc = v.videoControls;
    return JSON.stringify({
        span: vc.speedGraphSpan,
        time: vc.videoTimeDisplay?.textContent,
        cur: Math.round((v.continuousPlayer?.getCurrentTime?.() || 0) * 100) / 100,
        pct: Math.round(parseFloat(document.getElementById('progressPlayed').style.width) * 100) / 100,
        aria: document.getElementById('progressContainer').getAttribute('aria-valuenow'),
    }, null, 1);
})()
