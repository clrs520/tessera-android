(() => {
    const cp = viewer.continuousPlayer;
    const mcp = viewer.multiCameraPlayer;
    const v = mcp.players.front;
    const q = (n) => document.getElementById(n);
    const seekable = [];
    for (let i = 0; i < v.seekable.length; i++) seekable.push([+v.seekable.start(i).toFixed(2), +v.seekable.end(i).toFixed(2)]);
    const buffered = [];
    for (let i = 0; i < v.buffered.length; i++) buffered.push([+v.buffered.start(i).toFixed(2), +v.buffered.end(i).toFixed(2)]);
    return JSON.stringify({
        ct: +cp.getCurrentTime().toFixed(2),
        seg: cp.currentSegmentIndex,
        total: +(cp.totalDuration || 0).toFixed(2),
        idxOfCt: cp.segmentIndexFor ? cp.segmentIndexFor(cp.getCurrentTime()) : null,
        isPlaying: mcp.isPlaying,
        paused: v.paused,
        ended: v.ended,
        seeking: v.seeking,
        readyState: v.readyState,
        networkState: v.networkState,
        ct2: +v.currentTime.toFixed(2),
        dur: isFinite(v.duration) ? +v.duration.toFixed(2) : null,
        err: v.error ? { code: v.error.code, message: v.error.message } : null,
        src: (v.currentSrc || v.src || '').split('/').pop().slice(0, 60),
        seekable, buffered,
        segFiles: cp.currentEvent ? cp.currentEvent.segments.length : null,
        durs: cp.segmentDurations ? cp.segmentDurations.map(d => +(+d).toFixed(2)) : null,
        starts: cp.segmentStartTimes ? cp.segmentStartTimes.map(d => +(+d).toFixed(2)) : null,
        playLabel: q('playPauseBtn')?.textContent?.trim(),
        ariaPlay: q('playPauseBtn')?.getAttribute('aria-label'),
        banner: q('jsErrorBanner')?.style.display !== 'none',
        bannerText: (q('jsErrorBanner')?.textContent || '').slice(0, 200),
        seeking_busy: cp._seeking || cp.isSeeking || null,
    }, null, 1);
})()
