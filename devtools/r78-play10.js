(function () {
    var v = window.viewer;
    if (!v) return 'NO-VIEWER';
    var g = (v.eventGroups || []).find(function (x) { return x.eventId === 'TeslaCam/RecentClips'; });
    if (!g) return 'NO RECENTCLIPS GROUP, n=' + (v.eventGroups || []).length;
    window.__r78 = [];
    v.playEvent(g.eventId);
    setTimeout(function () {
        try {
            if (v.multiCameraPlayer.setLayout) v.multiCameraPlayer.setLayout('grid');
            var cp = v.continuousPlayer;
            if (cp.seekToTime) cp.seekToTime(0);
            v.multiCameraPlayer.playAll();
            window.__r78play = 'started idx=' + cp.currentSegmentIndex + ' seen=[' + Object.keys(cp.axisSeen || {}).join(',') + ']';
        } catch (e) { window.__r78play = 'ERR ' + String(e).slice(0, 120); }
    }, 6000);
    return 'kicked segs=' + (g.segments || []).length;
})();
