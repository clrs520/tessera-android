(function () {
    var gs = (window.viewer.eventGroups || []).slice().sort(function (a, b) {
        return (b.segments || []).length - (a.segments || []).length;
    });
    return JSON.stringify(gs.slice(0, 8).map(function (g) {
        var segs = g.segments || [];
        var fr = segs.map(function (s) { return s.files && s.files['front']; }).filter(Boolean);
        var dur = segs.reduce(function (a, s) { return a + (s.duration || 0); }, 0);
        return { id: g.eventId, segs: segs.length, durS: Math.round(dur), front: fr.length,
                 avgMB: fr.length ? Math.round(fr.reduce(function (a, f) { return a + (f.size || 0); }, 0) / fr.length / 1048576) : 0 };
    }));
})();
