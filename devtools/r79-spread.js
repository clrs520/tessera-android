// R79: how far apart are the tiles when their snapshots come down?
//
// The phone's `holds` block told the story as one minute boundary melting tile by tile
// (446/512/628/730/804/927 ms) while `front` — the reference clock — kept running to `ref=0.49`.
// The last tile therefore uncovered about half a second behind its own feed, and the corrector
// then had to drag it, which is where `lost` comes from.
//
// This groups the released snapshots by the segment they were spliced INTO and reports, per
// boundary: the wall-clock `ms` each still took to come down, the `ref` each feed was behind the
// clock at that instant, the spread of those refs (the number the gate is supposed to collapse to
// ~0), and the `gate=` tag that says whether the hand-over was a gate at all.
//
// Read-only. Nothing here changes playback.
(() => {
    const cp = window.viewer && window.viewer.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no multiCameraPlayer' });
    const hasGate = typeof cp.openSeamGate === 'function';

    // Only rows that actually handed a picture back count; `skip=` rows never covered a tile and
    // `STILL-STANDING` rows are measured live by `describeHolds()`, not by this ledger.
    const rows = (cp.holdLog || []).filter(e => e.end && e.end !== 'skip');
    const bySeg = {};
    rows.forEach(e => {
        const key = e.seg === undefined ? '?' : e.seg;
        (bySeg[key] = bySeg[key] || []).push(e);
    });

    const boundaries = Object.keys(bySeg).sort((a, b) => (a === '?' ? 1 : b === '?' ? -1 : a - b)).map(seg => {
        const list = bySeg[seg];
        const refs = list.filter(e => typeof e.ref === 'number').map(e => e.ref);
        const times = list.map(e => e.ms).filter(n => typeof n === 'number');
        const refSpread = refs.length > 1 ? +(Math.max(...refs) - Math.min(...refs)).toFixed(2) : null;
        const msSpread = times.length > 1 ? Math.max(...times) - Math.min(...times) : null;
        return {
            seg,
            feeds: list.length,
            cams: list.map(e => e.cam),
            ms: times,
            msSpread,
            ref: refs,
            // The headline: the widest gap between any two tiles at the moment their stills came
            // down. Before the gate this is the ~0.5 s the corrector then has to close.
            refSpread,
            ends: list.map(e => e.end + (e.via ? '/' + e.via : '')),
            gate: list.map(e => e.gate).filter(Boolean),
            // R80: the other half of the phone's 1.2.118 dump. `buf` is `buffered.end` at the instant
            // the still came down — 1.2.117 read 13-15 s, 1.2.118 read 2.5-3.8 s, and the run then
            // gained `q=27-32` drops and `w=4-10` stalls. The suspect is the gate's deferred `playAll()`:
            // a *paused* element buffers to a far smaller target than a playing one. Same device, both
            // arms, one variable — that is what this column decides.
            buf: list.map(e => e.buf).filter(n => typeof n === 'number' && n >= 0),
            bufMean: (() => {
                const b = list.map(e => e.buf).filter(n => typeof n === 'number' && n >= 0);
                return b.length ? +(b.reduce((s, n) => s + n, 0) / b.length).toFixed(2) : null;
            })(),
            lm: list.map(e => e.lm).filter(n => typeof n === 'number' && n >= 0),
        };
    });

    const spreads = boundaries.map(b => b.refSpread).filter(n => typeof n === 'number');
    const msSpreads = boundaries.map(b => b.msSpread).filter(n => typeof n === 'number');

    return JSON.stringify({
        gateMethodPresent: hasGate,
        heldFramesNow: Object.keys(cp.heldFrames || {}).length,
        seamNow: cp.seam ? {
            need: cp.seam.need.size, ready: cp.seam.ready.size,
            resume: !!cp.seam.resume, ms: Math.round(performance.now() - cp.seam.openedAt),
        } : null,
        boundaries,
        worstRefSpread: spreads.length ? Math.max(...spreads) : null,
        worstMsSpread: msSpreads.length ? Math.max(...msSpreads) : null,
        // Mean of the per-boundary means, so a single boundary near the tape's end (where the last
        // clip is only 11.7 s long and `buf` cannot be large) cannot stand in for the trend.
        bufMeanAll: (() => {
            const b = boundaries.map(x => x.bufMean).filter(n => typeof n === 'number');
            return b.length ? +(b.reduce((s, n) => s + n, 0) / b.length).toFixed(2) : null;
        })(),
        // A gate is doing its job when every tile of a boundary carries the same `gate=` tag —
        // same reason, same ready-count, same elapsed time — and the ref spread collapses.
        uniformTagBoundaries: boundaries.filter(b => b.gate.length === b.feeds
            && new Set(b.gate).size === 1).length,
    }, null, 2);
})();
