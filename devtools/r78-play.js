(function () {
    var v = window.viewer;
    if (!v) return 'NO-VIEWER';
    var g = (v.eventGroups || [])[0];
    if (!g) return 'NO-GROUP';
    if (typeof v.playEvent !== 'function') return 'NO playEvent';
    v.playEvent(g.eventId);
    setTimeout(function () {
        try {
            if (v.multiCameraPlayer && v.multiCameraPlayer.setLayout) v.multiCameraPlayer.setLayout('grid');
            var cp = v.continuousPlayer;
            if (cp && cp.seekToTime) cp.seekToTime(0);
            if (v.multiCameraPlayer) v.multiCameraPlayer.playAll();
            window.__r78play = 'started idx=' + (cp && cp.currentSegmentIndex) +
                ' seen=[' + Object.keys((cp && cp.axisSeen) || {}).join(',') + ']';
        } catch (e) { window.__r78play = 'ERR ' + String(e).slice(0, 120); }
    }, 6000);
    return 'kicked ' + g.eventId + ' segs=' + (g.segments || []).length;
})();
