(() => new Promise(resolve => {
    const out = [];
    const v = document.querySelector('#front-player');
    let n = 0;
    const tick = () => {
        const band = viewer.pictureGestureBand();
        out.push({
            i: n,
            w: band ? Math.round(band.width) : null,
            l: band ? Math.round(band.left) : null,
            nat: v.videoWidth + 'x' + v.videoHeight,
            rs: v.readyState,
        });
        if (++n < 26) { setTimeout(tick, 120); }
        else {
            const widths = {};
            out.forEach(e => { widths[e.w] = (widths[e.w] || 0) + 1; });
            resolve(JSON.stringify({ distinctWidths: widths, first: out.slice(0, 6), last: out.slice(-4) }, null, 1));
        }
    };
    viewer.continuousPlayer.seekToTime(viewer.continuousPlayer.getCurrentTime() + 55).then(() => {});
    setTimeout(tick, 60);
}))()
