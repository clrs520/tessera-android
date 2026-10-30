// Fire-and-forget grid-order A/B.
//
// Same-synchronous-task `getComputedStyle(order)` is unreliable in this WebView (an injected
// <style> and a class toggle both read back the old value), so each phase waits for a real
// paint and the verdict is taken from tile rectangles, which are provably live.
(function () {
    var root = document.documentElement;
    var AREA = '.player-area.grid-view .video-container';
    function tiles() {
        return Array.prototype.slice.call(document.querySelectorAll(AREA)).map(function (c) {
            var r = c.getBoundingClientRect();
            return { cam: c.getAttribute('data-camera'), x: Math.round(r.left), y: Math.round(r.top),
                     order: getComputedStyle(c).order };
        });
    }
    function reading(list) {
        var ys = list.map(function (t) { return t.y; }).sort(function (a, b) { return a - b; });
        var bands = [];
        ys.forEach(function (y) { if (!bands.some(function (b) { return Math.abs(b - y) < 20; })) bands.push(y); });
        bands.sort(function (a, b) { return a - b; });
        return list.slice().sort(function (a, b) {
            var ra = bands.findIndex(function (y) { return Math.abs(y - a.y) < 20; });
            var rb = bands.findIndex(function (y) { return Math.abs(y - b.y) < 20; });
            return ra - rb || a.x - b.x;
        }).map(function (t) { return t.cam; });
    }
    function tick() {
        return new Promise(function (res) {
            requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(res, 60); }); });
        });
    }
    window.__ab = { running: true, had: root.classList.contains('touch-ui') };
    Promise.resolve()
        .then(tick).then(function () { window.__ab.phone = reading(tiles()); })
        .then(function () { root.classList.remove('touch-ui'); window.__ab.classOff = !root.classList.contains('touch-ui'); return tick(); })
        .then(function () { window.__ab.desktop = reading(tiles()); window.__ab.desktopOrder = tiles().map(function (t) { return t.cam + '=' + t.order; }).join(' '); })
        .then(function () { root.classList.add('touch-ui'); return tick(); })
        .then(function () { window.__ab.restoredReading = reading(tiles()); window.__ab.running = false; })
        .catch(function (e) { window.__ab.error = String(e); window.__ab.running = false; });
    return 'armed';
})();
