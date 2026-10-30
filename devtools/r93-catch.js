(function () {
    window.__r93err = [];
    if (window.__r93armed) return 'already armed';
    window.__r93armed = true;
    window.addEventListener('error', function (e) {
        window.__r93err.push({
            kind: 'error', msg: String(e.message), file: String(e.filename),
            ln: e.lineno, col: e.colno,
            stack: (e.error && e.error.stack ? String(e.error.stack) : '').slice(0, 900)
        });
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
        var r = e.reason;
        window.__r93err.push({
            kind: 'reject', msg: String(r && r.message || r).slice(0, 300),
            stack: (r && r.stack ? String(r.stack) : '').slice(0, 900)
        });
    }, true);
    return 'armed';
})();
