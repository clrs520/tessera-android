(() => {
    window.__pa = [];
    if (window.__paHooked) return JSON.stringify({ already: true, log: window.__pa });
    const proto = Object.getPrototypeOf(viewer.multiCameraPlayer);
    const orig = proto.pauseAll;
    proto.pauseAll = function (...a) {
        window.__pa.push('pauseAll() ' + new Error().stack.split(String.fromCharCode(10)).slice(1, 7).join(' <- '));
        return orig.apply(this, a);
    };
    const vids = new Set(Object.values(viewer.multiCameraPlayer.players));
    const origPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () {
        if (vids.has(this)) {
            const mark = 'video.' + (this.closest('.video-container')?.dataset.camera) + '.pause() ' +
                new Error().stack.split(String.fromCharCode(10)).slice(1, 6).join(' <- ');
            if (window.__pa.length < 40) window.__pa.push(mark);
        }
        return origPause.apply(this, arguments);
    };
    window.__paHooked = true;
    return JSON.stringify({ hooked: true });
})()
