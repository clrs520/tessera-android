(function () {
    var v = window.viewer;
    if (!v) return 'NO-VIEWER';
    if ((v.events || []).length) return 'already ' + v.events.length + ' events';
    v.loadTauriDirectory('/storage/emulated/0/TeslaCam')
        .then(function (r) { window.__r78load = 'ok ' + ((v.events || []).length); })
        .catch(function (e) { window.__r78load = 'ERR ' + String(e).slice(0, 120); });
    return 'kicked';
})();
