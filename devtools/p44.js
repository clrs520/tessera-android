(() => {
    // R65: 「拖完进度条以后有一路开始卡」 is a claim about how often the corrector aims each feed, and
    // nothing in the app counts that. Wrap the one setter every path goes through, tag each write with
    // the feed and the function that wrote it, and keep the timeline so a burst reads per second.
    if (window.__hw) return 'already armed';
    const p = viewer.multiCameraPlayer;
    const names = new Map();
    Object.entries(p.players).forEach(([cam, el]) => { if (el) names.set(el, cam); });
    const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
    if (!desc || !desc.set) return 'no accessor';
    const L = { armed: performance.now(), writes: {}, by: {}, hist: {}, total: 0 };
    window.__hw = L;
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
        configurable: true,
        enumerable: desc.enumerable,
        get: desc.get,
        set: function (value) {
            const cam = names.get(this);
            if (cam) {
                const t = Math.round(performance.now() - L.armed);
                const frame = (new Error().stack || '').split('\n')[2] || '';
                const who = (frame.match(/at\s+([A-Za-z0-9_.$<>]+)/) || [null, '?'])[1];
                L.total++;
                L.writes[cam] = (L.writes[cam] || 0) + 1;
                L.by[who] = (L.by[who] || 0) + 1;
                (L.hist[cam] = L.hist[cam] || []).push([t, +value.toFixed(2)]);
                if (L.hist[cam].length > 80) L.hist[cam].shift();
            }
            return desc.set.call(this, value);
        }
    });
    return 'armed ' + names.size;
})()
