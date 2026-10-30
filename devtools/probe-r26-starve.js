// Does a filmstrip grab succeed while the 6 cameras keep decoding?
(async () => {
    const ctr = viewer.videoControls;
    const ev = viewer.currentEvent;
    const t = ctr.clipFrameTarget(ev, ctr.totalDuration * 0.75);
    const pausedNow = [...document.querySelectorAll('video')].every(v => v.paused);
    const started = Date.now();
    const url = await new Promise(res => {
        FrameFetcher.get(t.path, t.seconds).then(res);
    });
    return JSON.stringify({
        pausedNow,
        target: { path: t.path.split('/').pop(), seconds: +t.seconds.toFixed(1) },
        ms: Date.now() - started,
        ok: typeof url === 'string' && url.startsWith('data:image'),
        cache: FrameFetcher.cache.size,
        live: FrameFetcher.live,
    });
})()
