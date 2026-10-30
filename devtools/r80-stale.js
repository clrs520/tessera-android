// R80 — the measurement that decides what the 1.2.118 row `back seg=9 11.66->0.26 -11.40 gap-band` is.
//
// Two candidate mechanisms, one sentence each:
//   (a) cross-segment — a hidden feed keeps the PREVIOUS segment's file (R64-1c `continue`) and the
//       corrector compares its local time against the reference's. REFUTED by reading the code:
//       `loadSegmentForAllCameras` calls `cleanup()` first, and `cleanup()` blanks EVERY player's `src`
//       (`player.src=''; load()`), so a skipped feed has no `src` at all and :5954 already skips it.
//   (b) stale position — `player.src` is the NEW file but `player.currentTime` still reports the OLD
//       file's position, because the load algorithm has not produced a media position yet. The corrector
//       then reads a 11 s gap that is really "two different files" and drags the tile.
//
// This reads (b) directly: park `back` deep inside a file, splice, and sample what it reports at 0 / 60 /
// 250 / 700 ms after the write — with `readyState`, so the freshness signal the guard would use is on the
// same row. Detached: it awaits, so CDP would time out; progress in `window.__r80stale`.
(async () => {
    const v = window.viewer;
    const cp = v && v.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no multiCameraPlayer' });
    const segs = (v.currentEvent && v.currentEvent.segments) || [];
    if (segs.length < 8) return JSON.stringify({ err: 'need 8 segments' });
    window.__r80stale = { state: 'running', steps: [] };
    const say = m => window.__r80stale.steps.push(m + ' @' + Math.round(performance.now()));
    const wait = (fn, ms, label) => new Promise((res, rej) => {
        const t0 = performance.now();
        const tick = () => {
            let ok = false; try { ok = fn(); } catch (e) { ok = false; }
            if (ok) return res(true);
            if (performance.now() - t0 > ms) return rej(new Error('timeout ' + label));
            setTimeout(tick, 50);
        };
        tick();
    });

    const run = async () => {
        const b = cp.players.back;
        cp.setLayout('grid');
        cp.pauseAll();
        // Put `back` on segment 5, deep into the file, buffered, paused.
        cp.currentSegment = segs[5];
        b.src = window.getFileUrl(segs[5].files.back);
        await wait(() => b.duration > 0, 15000, 'seg5 metadata');
        await wait(() => b.buffered.length && b.buffered.end(b.buffered.length - 1) >= 14.2, 25000, 'seg5 buffer');
        b.currentTime = 14;
        await wait(() => Math.abs(b.currentTime - 14) < 0.3 && !b.seeking, 15000, 'seg5 seek');
        const staged = { t: +b.currentTime.toFixed(2), rs: b.readyState, dur: +b.duration.toFixed(2) };
        say('staged ' + JSON.stringify(staged));

        // Now the splice, and sample what `back` reports as the new file is being selected.
        const before = { src: b.src, t: +b.currentTime.toFixed(2), rs: b.readyState };
        const p = cp.loadSegmentForAllCameras(segs[7]);
        const sample = () => ({
            t: +b.currentTime.toFixed(2), rs: b.readyState, ns: b.networkState,
            dur: isFinite(b.duration) ? +b.duration.toFixed(2) : b.duration,
            sameSrc: b.src === window.getFileUrl(segs[7].files.back),
            cur: b.currentSrc ? b.currentSrc.slice(-14) : '',
        });
        const sync = sample();
        await new Promise(r => setTimeout(r, 60)); const s60 = sample();
        await new Promise(r => setTimeout(r, 190)); const s250 = sample();
        await new Promise(r => setTimeout(r, 450)); const s700 = sample();
        await p;
        const settled = sample();
        say('settled ' + JSON.stringify(settled));

        const stale = [sync, s60, s250, s700].filter(s => s.t > 5);
        window.__r80stale = {
            state: 'done', staged, before, sync, s60, s250, s700, settled,
            verdict: stale.length
                ? `STALE WINDOW: ${stale.length} sample(s) reported a position from the previous file `
                    + `(readyState ${stale.map(s => s.rs).join('/')}) while src pointed at the new segment`
                : `NO STALE WINDOW: every sample read the new file (or blanked) — mechanism (b) is out, `
                    + 'so the phone row needs a different explanation',
        };
    };
    run().catch(e => { window.__r80stale = { state: 'error', message: String((e && e.message) || e), steps: window.__r80stale.steps }; });
    return JSON.stringify({ kicked: true });
})();
