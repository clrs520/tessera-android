(() => new Promise(res => {
    // Where do the seconds of a crossing go? Time three things for the *next* segment's file, read
    // straight from the local stream server the same way the <video> does it:
    //   head    — what a demuxer's first probe costs (moov-at-end files make it read the tail)
    //   firstMB — a real range read
    //   whole   — the file in full, i.e. the ceiling on any preload
    // If these are fast, the wait is inside the WebView element, not the server.
    const cp = viewer.continuousPlayer, p = cp.multiCameraPlayer;
    const next = cp.currentSegmentIndex + 1;
    const seg = (cp.currentEvent && cp.currentEvent.segments || [])[next];
    const url = seg && seg.files && seg.files.front && getFileUrl(seg.files.front);
    if (!url) return res(JSON.stringify({ error: 'no next url', next, keys: Object.keys(seg || {}) }));
    const t = {};
    const time = async (label, init) => {
        const t0 = performance.now();
        try {
            const r = await fetch(url, init);
            const buf = await r.arrayBuffer();
            t[label] = { ms: Math.round(performance.now() - t0), status: r.status, bytes: buf.byteLength };
        } catch (e) { t[label] = { error: String(e).slice(0, 80) }; }
    };
    // Two calls again: the whole-file read alone can exceed the CDP answer budget.
    if (window.__p41) {
        const out = window.__p41; delete window.__p41;
        return res(JSON.stringify(Object.assign(out, {
            next, local: +(p.players.front.currentTime).toFixed(2),
            at: { ct: +cp.getCurrentTime().toFixed(1), playing: !!p.isPlaying } })));
    }
    window.__p41 = { started: Math.round(performance.now()) };
    res(JSON.stringify({ armed: next }));
    time('head', { headers: { Range: 'bytes=0-1' } })
        .then(() => time('firstMB', { headers: { Range: 'bytes=0-1048575' } }))
        .then(() => time('whole', {}))
        .then(() => { window.__p41 = { t, ms: Math.round(performance.now() - window.__p41.started) }; });
}))()
