// One native request, end to end, with the path the filmstrip actually asks for.
(async () => {
    const ctr = viewer.videoControls;
    const ev = viewer.currentEvent;
    const t = ctr.clipFrameTarget(ev, ctr.totalDuration * 0.5);
    const seen = [];
    const prev = window.__tdashcamNativeThumb;
    window.__tdashcamNativeThumb = (id, dataUrl) => {
        seen.push({ id, len: dataUrl ? dataUrl.length : null, head: dataUrl ? dataUrl.slice(0, 30) : null });
        prev(id, dataUrl);
    };
    const t0 = Date.now();
    window.TDashcamNative.requestThumb('probe1', String(t.path), Math.max(0, Math.round(t.seconds * 1000)), 160);
    const sent = Date.now() - t0;
    await new Promise(r => setTimeout(r, 4000));
    window.__tdashcamNativeThumb = prev;
    return JSON.stringify({ path: t.path, seconds: +t.seconds.toFixed(2), bridgeReturnedMs: sent, seen, cache: FrameFetcher.cache.size });
})()
