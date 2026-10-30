(() => {
    const v = window.viewer, vc = v.videoControls;
    const dur = vc.totalDuration || 18.27;
    const samples = [];
    for (let t = 0; t <= dur; t += 0.5) {
        samples.push({ time: t, segmentStart: 0, data: { vehicleSpeedMps: 8 + 12 * Math.abs(Math.sin(t / 3)) } });
    }
    vc.drawSpeedGraph([samples], [dur]);
    const b = vc.speedGraphContainer.getBoundingClientRect();
    return JSON.stringify({
        span: vc.speedGraphSpan,
        cls: vc.speedGraphContainer.className,
        rect: { left: Math.round(b.left * 100) / 100, width: Math.round(b.width * 100) / 100, height: Math.round(b.height * 100) / 100, top: Math.round(b.top * 100) / 100 },
        dpr: devicePixelRatio,
        before: { time: vc.videoTimeDisplay?.textContent, cur: v.continuousPlayer?.getCurrentTime?.(), aria: document.getElementById('progressContainer').getAttribute('aria-valuenow') },
    }, null, 1);
})()
