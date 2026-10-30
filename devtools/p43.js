(() => new Promise(res => {
    // Stalled `waiting` on a fresh segment: is the network late or is the decoder late? The emulator
    // software-decodes a 1080x2400 feed, so this decides whether 「画面卡死」 has a JS half left in it.
    // Compare media time gained against decoded frames gained over one sample window.
    const p = viewer.multiCameraPlayer, el = p.players[p.activeCamera];
    const q0 = el.getVideoPlaybackQuality ? el.getVideoPlaybackQuality() : null;
    const c0 = el.currentTime, t0 = performance.now();
    setTimeout(() => {
        const q1 = el.getVideoPlaybackQuality ? el.getVideoPlaybackQuality() : null;
        const wall = (performance.now() - t0) / 1000;
        const dMedia = +(el.currentTime - c0).toFixed(2);
        const frames = q1 && q0 ? q1.totalVideoFrames - q0.totalVideoFrames : null;
        const dropped = q1 && q0 ? q1.droppedVideoFrames - q0.droppedVideoFrames : null;
        res(JSON.stringify({
            cam: p.activeCamera, wall: +wall.toFixed(2), mediaGained: dMedia,
            ratio: +(dMedia / wall).toFixed(2), frames, dropped,
            fps: frames && dMedia ? +(frames / dMedia).toFixed(1) : null,
            dropPct: frames ? +(100 * dropped / (frames + dropped)).toFixed(0) + '%' : null,
            total: q1 ? q1.totalVideoFrames : null, buf: +(el.buffered.length
                ? el.buffered.end(el.buffered.length - 1) : 0).toFixed(1), rs: el.readyState
        }));
    }, 3000);
}))()
