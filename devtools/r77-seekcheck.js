(function () {
    var v = window.viewer, cp = v.continuousPlayer, mcp = v.multiCameraPlayer;
    var segs = cp.currentEvent.segments;
    var out = [];
    // Each clip's own wall-clock start comes from its file name, independent of the ruler.
    function nameStart(i) {
        var f = segs[i] && (segs[i].fileName || segs[i].name || (segs[i].front && segs[i].front.fileName));
        var m = String(f || '').match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
        if (!m) return null;
        return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
    }
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var hhmmss = function (t) { var d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); };
    [20, 60, 100].forEach(function (T) {
        cp.seekToTime(T);
        var i = cp.currentSegmentIndex;
        var local = T - cp.segmentStartTimes[i];
        var ns = nameStart(i);
        out.push('drag->ruler T=' + T.toFixed(2) + '  lands clip ' + i + ' at local ' + local.toFixed(2)
            + '  expected wall ' + (ns ? hhmmss(ns + local * 1000) : 'no-name')
            + '  header says ' + (document.getElementById('realTimeClock') || {}).textContent
            + '  front.t=' + mcp.players.front.currentTime.toFixed(2)
            + '  idx=' + i);
    });
    return out.join('\n');
})();
