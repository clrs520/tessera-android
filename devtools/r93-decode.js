(async function () {
    var v = window.viewer, mm = v.metadataManager;
    var g = (v.eventGroups || []).filter(function (x) { return (x.segments || []).length >= 3; })[0];
    var files = [];
    (v.eventGroups || []).forEach(function (e) {
        (e.segments || []).forEach(function (s) {
            var f = s.files && s.files['front'];
            if (f && f.path && /2026-10-09/.test(f.path)) files.push(f);
        });
    });
    var out = { tried: files.length, before: (window.__r93err || []).length, viewerErrors: v.recentErrors.length };
    for (var i = 0; i < files.length; i++) {
        MetadataManager.seiCache.clear();
        var t = performance.now();
        var tel = await mm.readTelemetry(files[i]);
        out.rows = (out.rows || []).concat([{ f: files[i].path.split('/').pop().slice(0, 26), ms: Math.round(performance.now() - t), pts: (tel || []).length }]);
        // exercise the derived readers the HUD/curve actually use
        mm.currentMetadata = tel;
        try { mm.buildStats ? mm.buildStats() : null; } catch (e) { out.buildStats = String(e.message); }
    }
    out.after = (window.__r93err || []).length;
    out.new = (window.__r93err || []).slice(out.before);
    out.viewerErrorsNow = v.recentErrors.length;
    return JSON.stringify(out);
})();
