// R93-G: can this device produce a boundary tail at all? The tail is cut when the six feeds of one
// segment end at different seconds — `front.ended` advances the event and whatever the others still
// hold is thrown away. So the bound is `max(duration) - min(duration)` over the six live feeds.
// One segment at a time: the players hold only the segment that is loaded right now.
(function () {
    var v = window.viewer;
    var cp = v.continuousPlayer;
    var d = {};
    Object.keys(v.multiCameraPlayer.players).forEach(function (k) {
        var p = v.multiCameraPlayer.players[k];
        if (p && isFinite(p.duration)) d[k] = Math.round(p.duration * 1000) / 1000;
    });
    var vs = Object.keys(d).map(function (k) { return d[k]; });
    if (vs.length < 2) return JSON.stringify({ err: 'need two loaded feeds', d: d });
    return JSON.stringify({
        event: String((v.currentEvent || {}).eventId || '').split('/').pop(),
        seg: cp && cp.currentSegmentIndex,
        n: vs.length, durations: d,
        min: Math.min.apply(null, vs), max: Math.max.apply(null, vs),
        // The most a splice could cut on this clip, in the recording's own seconds.
        tailBound: Math.round((Math.max.apply(null, vs) - Math.min.apply(null, vs)) * 1000) / 1000,
    });
})();
