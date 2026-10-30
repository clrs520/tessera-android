(async function () {
    var v = window.viewer;
    var g = (v.eventGroups || []).filter(function (x) { return (x.segments || []).length >= 3; })[0];
    if (!g) return 'NO-MULTI-EVENT';
    var mm = v.metadataManager;
    var rows = [];
    for (var i = 0; i < Math.min(4, g.segments.length); i++) {
        var f = g.segments[i].files && g.segments[i].files['front'];
        if (!f || !f.path) { rows.push({ i: i, err: 'no-front' }); continue; }
        var t0 = performance.now();
        var raw = await mm.readTelemetryNative(f);
        var coldMs = Math.round(performance.now() - t0);
        var n = (raw || []).length;
        // warm: full path with the parse+decode, cache cleared first
        MetadataManager.seiCache.clear();
        var t1 = performance.now();
        var tel = await mm.readTelemetry(f);
        var warmMs = Math.round(performance.now() - t1);
        var t2 = performance.now();
        await mm.readTelemetry(f);
        rows.push({ i: i, nativeMs: coldMs, nativeItems: n, fullMs: warmMs, tel: (tel || []).length, cachedMs: Math.round((performance.now() - t2) * 10) / 10,
                    name: f.path.split('/').pop() });
    }
    return JSON.stringify({ event: g.eventId, rows: rows });
})();
