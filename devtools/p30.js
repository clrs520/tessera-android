(() => new Promise(resolve => {
    // What is the element doing during a multi-second freeze: waiting for bytes, or a seek that never
    // completes? `video.waiting` / `stalled` / `seeking`+`seeked` is the element's own testimony, and it
    // costs nothing to ask.
    const cp = viewer.continuousPlayer;
    const v = document.querySelector('#front-player');
    const t0 = performance.now();
    const ev = [];
    const mark = n => ev.push([n, +(performance.now() - t0).toFixed(0), +v.currentTime.toFixed(2)]);
    ['seeking', 'seeked', 'waiting', 'stalled', 'play', 'pause', 'ended'].forEach(n =>
        v.addEventListener(n, () => mark(n)));
    const base = cp.segmentStartTimes[cp.currentSegmentIndex] || 0;
    const seeks = [base + 3, base + 13.6, base + 6];
    seeks.forEach((t, i) => setTimeout(() => {
        cp.seekToTime(t);
        ev.push(['seekToTime', +(performance.now() - t0).toFixed(0), +t.toFixed(1)]);
    }, i * 1600));
    setTimeout(() => {
        const buf = [];
        for (let i = 0; i < v.buffered.length; i++) buf.push([+v.buffered.start(i).toFixed(1), +v.buffered.end(i).toFixed(1)]);
        resolve(JSON.stringify({
            seg: cp.currentSegmentIndex, dur: +v.duration.toFixed(2), rs: v.readyState,
            seeking: v.seeking, paused: v.paused, ct: +v.currentTime.toFixed(2),
            rate: v.playbackRate, buf, net: v.networkState, ev,
        }, null, 1));
    }, 6000);
}))()
