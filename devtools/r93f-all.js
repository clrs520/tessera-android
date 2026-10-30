(async function () {
    var v = window.viewer, mm = v.metadataManager;
    var rows = [], totalMs = 0, totalItems = 0, n = 0;
    for (var gi = 0; gi < (v.eventGroups || []).length; gi++) {
        var segs = v.eventGroups[gi].segments || [];
        for (var si = 0; si < segs.length && n < 14; si++) {
            var f = segs[si].files && (segs[si].files['front'] || Object.values(segs[si].files)[0]);
            if (!f || !f.path) continue;
            n++;
            var t = performance.now();
            var raw = await mm.readTelemetryNative(f);
            var ms = Math.round(performance.now() - t);
            totalMs += ms; totalItems += (raw || []).length;
            rows.push({ f: f.path.split('/').pop().slice(0, 34), ms: ms, items: (raw || []).length });
        }
    }
    return JSON.stringify({ files: n, avgMs: Math.round(totalMs / n), totalItems: totalItems, rows: rows });
})();
