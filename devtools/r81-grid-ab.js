(function () {
    var v = window.viewer;
    if (!v) return 'NO VIEWER';
    var root = document.documentElement;
    var had = root.classList.contains('touch-ui');
    function read() {
        var cells = Array.prototype.slice.call(
            document.querySelectorAll('.player-area.grid-view .video-container'));
        return cells.map(function (c) {
            return { cam: c.getAttribute('data-camera'), o: +getComputedStyle(c).order };
        }).sort(function (a, b) { return a.o - b.o; }).map(function (r) { return r.cam; });
    }
    var out = { withTouchUi: null, desktopGateOff: null, restored: null };
    out.withTouchUi = read();
    root.classList.remove('touch-ui');
    out.desktopGateOff = read();
    if (had) root.classList.add('touch-ui');
    out.restored = root.classList.contains('touch-ui');
    out.desktopExpected = ['left_pillar', 'front', 'right_pillar', 'left', 'back', 'right'];
    out.phoneExpected = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
    out.desktopUnchanged = out.desktopGateOff.join() === out.desktopExpected.join();
    out.phoneOrderCorrect = out.withTouchUi.join() === out.phoneExpected.join();
    return JSON.stringify(out, null, 1);
})();
