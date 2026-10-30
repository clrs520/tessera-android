(() => {
    // A faithful stand-in for a REAL event: the fixture books 60s per segment but every file is 18.27s,
    // so nearly every ±10s tap on it lands on (or past) the wall of the clip and gets clamped — which is
    // a worst case a real recording does not produce. This rewrites the timeline to the durations that
    // are actually loaded, so the burst measures the case users have.
    const cp = viewer.continuousPlayer;
    const real = cp.loadedSegmentDuration() || 18.27;
    const n = cp.currentEvent.segments.length;
    cp.segmentStartTimes = Array.from({ length: n }, (_, i) => +(i * real).toFixed(2));
    cp.segmentDurations = Array.from({ length: n }, () => real);
    cp.totalDuration = +(n * real).toFixed(2);
    cp.currentEvent.totalDuration = cp.totalDuration;
    viewer.videoControls.setTotalDuration(cp.totalDuration);
    cp.seekToTime(Math.min(real * 3 + 6, cp.totalDuration - 20));
    return JSON.stringify({ real: +real.toFixed(2), segments: n, total: cp.totalDuration,
        starts: cp.segmentStartTimes.slice(0, 5) }, null, 1);
})()
