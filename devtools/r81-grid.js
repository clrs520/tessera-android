(function () {
    var v = window.viewer;
    if (!v) return 'NO VIEWER';
    var cp = v.multiCameraPlayer;
    if (!cp) return 'NO multiCameraPlayer';
    cp.setLayout('grid');
    var cells = Array.prototype.slice.call(
        document.querySelectorAll('.player-area.grid-view .video-container'));
    if (cells.length < 2) return 'GRID NOT PAINTED: ' + cells.length;
    var rows = cells.map(function (c) {
        var r = c.getBoundingClientRect();
        return {
            cam: c.getAttribute('data-camera'),
            order: getComputedStyle(c).order,
            x: Math.round(r.left),
            y: Math.round(r.top),
            w: Math.round(r.width),
            label: (c.textContent || '').trim().slice(0, 12)
        };
    });
    var ys = rows.map(function (r) { return r.y; }).sort(function (a, b) { return a - b; });
    var bands = [];
    ys.forEach(function (y) {
        if (!bands.some(function (b) { return Math.abs(b - y) < 20; })) bands.push(y);
    });
    bands.sort(function (a, b) { return a - b; });
    var visual = rows.slice().sort(function (a, b) {
        var ra = bands.findIndex(function (y) { return Math.abs(y - a.y) < 20; });
        var rb = bands.findIndex(function (y) { return Math.abs(y - b.y) < 20; });
        return ra - rb || a.x - b.x;
    });
    return JSON.stringify({
        touchUi: document.documentElement.classList.contains('touch-ui'),
        bootTheme: document.documentElement.dataset.bootTheme,
        rows: bands.length,
        visualOrder: visual.map(function (r) { return r.cam; }),
        expected: ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'],
        cells: visual
    }, null, 1);
})();
