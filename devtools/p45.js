(() => {
    // R65 read-out: per-feed aim count, who aimed, how far behind the shared clock each feed sits,
    // what the decoder itself dropped, and what the corrector state machine did about it.
    const L = window.__hw;
    if (!L) return 'not armed';
    const p = viewer.multiCameraPlayer, clock = p.clockTime();
    const rows = Object.keys(p.players).map(cam => {
        const el = p.players[cam];
        const s = (p.feedStats || {})[cam] || {};
        const tail = el.buffered && el.buffered.length ? el.buffered.end(el.buffered.length - 1) : 0;
        const q = el.getVideoPlaybackQuality ? el.getVideoPlaybackQuality() : null;
        return {
            cam: cam,
            w: L.writes[cam] || 0,
            t: +el.currentTime.toFixed(2),
            d: clock === null ? null : +(clock - el.currentTime).toFixed(2),
            rate: el.playbackRate,
            p: el.paused ? 1 : 0,
            sk: el.seeking ? 1 : 0,
            susp: p.suspendedFeeds.has(cam) ? 1 : 0,
            rs: el.readyState,
            ahead: +(tail - el.currentTime).toFixed(1),
            drop: q ? q.droppedVideoFrames + '/' + q.totalVideoFrames : '-',
            wait: s.waiting, stall: s.stalled, seeks: s.seeks,
            corr: s.corrections, glide: s.glides, jump: s.jumps, gliding: s.gliding ? 1 : 0,
            zoom: (window.viewer.feedZoom || {})[cam] ? window.viewer.feedZoom[cam].scale : 1
        };
    });
    const perSec = {};
    let last = -1;
    Object.keys(L.hist).forEach(cam => L.hist[cam].forEach(pair => {
        const b = Math.floor(pair[0] / 1000);
        perSec[b] = (perSec[b] || 0) + 1;
        if (b > last) last = b;
    }));
    // Record how long the counter window actually ran. Two runs with different tails are not
    // comparable, and 「after the last gesture it went quiet」 is only meaningful against a known length.
    const windowSec = +((performance.now() - (L.armed || performance.now())) / 1000).toFixed(1);
    return JSON.stringify({
        total: L.total, by: L.by, perSec: perSec,
        windowSec: windowSec, lastWriteSec: last, quietTailSec: last < 0 ? windowSec : +(windowSec - last).toFixed(1),
        clock: clock === null ? null : +clock.toFixed(2),
        playing: p.isPlaying ? 1 : 0, ref: p.activeCamera, layout: p.layoutMode,
        rate: p.playbackRate, rows: rows, errs: (window.__errs || []).slice(-6)
    }, null, 1);
})()
