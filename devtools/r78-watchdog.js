(function () {
    var cp = window.viewer && window.viewer.continuousPlayer;
    if (!cp) return 'NO CONTINUOUS PLAYER';
    var p = cp.multiCameraPlayer.players.front;
    if (!p) return 'NO FRONT PLAYER';
    var out = [];
    // Keep the ruler untouched while the ledger is exercised.
    var origRebook = cp.rebookAxis;
    cp.rebookAxis = function () { out.push('rebookAxis called (would have mutated the axis)'); return false; };
    // A clip whose length is not known yet, and that will never fire loadedmetadata again.
    var fake = NaN;
    Object.defineProperty(p, 'duration', { configurable: true, get: function () { return fake; } });
    cp.axisSeen = {};
    cp.axisLog = [];
    var idx = cp.currentSegmentIndex;
    cp.noteAxis(idx);
    out.push('after noteAxis: watch=' + (cp.axisWatch ? 'set' : 'null') +
        ' axisWait=' + (p.axisWait ? 'set' : 'null') + ' seen=' + Object.keys(cp.axisSeen).join(','));
    // Two seconds later the file has learned its length, but no event is delivered to anybody.
    setTimeout(function () {
        fake = 41.5;
        setTimeout(function () {
            out.push('after duration became knowable: seen=' + Object.keys(cp.axisSeen).join(',') +
                ' log=' + JSON.stringify(cp.axisLog));
            out.push('VERDICT: ' + (Object.keys(cp.axisSeen).indexOf(String(idx)) >= 0 ? 'RECOVERED' : 'LOST FOREVER'));
            delete p.duration;
            cp.rebookAxis = origRebook;
            window.__r78wd = out.join('\n');
        }, 1600);
    }, 1200);
    return 'running (index=' + idx + ')';
})();
