(function () {
    var v = window.viewer;
    if (!v) return 'NO-VIEWER (the page reloaded; the ledgers are gone)';
    var cp = v.continuousPlayer;
    var mcp = v.multiCameraPlayer;
    var box = function (x) { return Array.isArray(x) ? x.join('\n') : String(x); };
    var out = [];
    if (!cp) return 'no continuousPlayer';
    var segs = cp.currentEvent ? cp.currentEvent.segments.length : 0;
    out.push('idx=' + cp.currentSegmentIndex + ' of ' + segs
        + ' playing=' + (mcp ? !!mcp.isPlaying : 'n/a')
        + ' transitioning=' + !!cp.isTransitioning);
    out.push('ruler totalDuration=' + (+cp.totalDuration).toFixed(2)
        + ' booked sum=' + (cp.segmentDurations || []).reduce(function (a, b) { return a + b; }, 0).toFixed(2));
    out.push('segmentDurations=' + (cp.segmentDurations || []).map(function (d) { return (+d).toFixed(2); }).join(','));
    out.push('segmentStartTimes=' + (cp.segmentStartTimes || []).map(function (d) { return (+d).toFixed(2); }).join(','));
    // The tape: what the files actually are, read from the feeds that are loaded right now.
    var tape = 0, known = 0, live = [];
    var cams = (mcp && mcp.players) || {};
    Object.keys(cams).forEach(function (c) {
        var p = cams[c];
        if (p && isFinite(p.duration) && p.duration > 0) live.push(c + '=' + (+p.duration).toFixed(2));
    });
    for (var i = 0; i < segs; i++) {
        var d = (cp.segmentDurations || [])[i] || 0;
        tape += d;
        if (Math.abs(d - 60) > 0.02 || i === segs - 1) known++;
    }
    out.push('measured clips (not the 60s guess)=' + known + '/' + segs);
    out.push('now-loaded feed durations: ' + live.join(' '));
    out.push('getCurrentTime=' + (+cp.getCurrentTime()).toFixed(2)
        + ' front.currentTime=' + (cams.front ? (+cams.front.currentTime).toFixed(2) : 'n/a'));
    out.push('--- describeAxis ---');
    out.push(box(cp.describeAxis ? cp.describeAxis() : 'missing'));
    out.push('--- describeLoss (must stay no worse than 1.2.114) ---');
    out.push(box(mcp && mcp.describeLoss ? mcp.describeLoss() : 'missing'));
    out.push('--- describeHolds (last 6) ---');
    var h = mcp && mcp.describeHolds ? mcp.describeHolds() : [];
    out.push(box(Array.isArray(h) ? h.slice(-6) : h));
    return out.join('\n');
})();
