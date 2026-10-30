// R80 acceptance test: a tile whose numbers are not comparable must never be dragged.
//
// `syncAllPlayers` subtracts each tile's `currentTime` from the reference's, and both are LOCAL to the
// file that element is holding. Two ways that comparison is meaningless on a phone, and the 1.2.118
// report paid for one of them (`back seg=9 11.66->0.26 -11.40 gap-band` — eleven seconds of that tile's
// own footage thrown away):
//   (a) the tile is pointed at a file the app did not hand it. `currentUrls[camera]` is written in the
//       same breath as `player.src` by both loaders, so a difference is exactly this case. Reachable via
//       the `loadDeferredFeed()` race (R64-2d family) and via `applyFeedVisibility()`'s hand align.
//   (b) the tile has no media position yet: for the first seconds of a splice `readyState` is 0,
//       `duration` is NaN and `currentTime` is 0 — measured on the AVD at 0/60/250/700 ms after the write
//       (devtools/r80-stale.js).
// Two earlier theories were REFUTED by measurement, and this file is the reason they are gone:
//   - "a hidden feed keeps the previous segment's file": `loadSegmentForAllCameras` calls `cleanup()`
//     first, which blanks EVERY player's `src`, so a skipped feed has no `src` at all and :5954 skips it.
//   - "the element keeps reporting the old file's position across the splice": it does not — it reads 0.
//
// Case 1 is the control: a tile the app itself loaded, with real drift, must still be corrected, or the
// guard is just a disabled corrector. Case 2 is the defect. Both are driven by the reference's own
// `timeupdate` (:6591 is the only caller), never by calling `syncAllPlayers()` by hand — a pass asked for
// by the probe measures a different moment than the app's own.
//
// Bench traps: `getFileUrl` takes the file OBJECT, not `.path`; a seek outside the buffered range leaves
// `seeking` stuck; `cp.isPlaying` lives on the player, not the continuous one; and the corrector is held
// off (`isSeeking`) while the tiles are being staged, because writing the reference's `currentTime` fires
// `timeupdate` and aligns the other tile during setup. Progress lands in `window.__r80cf`.
(async () => {
    const v = window.viewer;
    const cp = v && v.multiCameraPlayer;
    if (!cp) return JSON.stringify({ err: 'no multiCameraPlayer' });
    const segs = (v.currentEvent && v.currentEvent.segments) || [];
    if (segs.length < 6) return JSON.stringify({ err: 'need 6 segments' });
    window.__r80cf = { state: 'running', steps: [] };
    const say = m => { window.__r80cf.steps.push(m + ' @' + Math.round(performance.now())); };

    const wait = (fn, ms, label) => new Promise((res, rej) => {
        const t0 = performance.now();
        const tick = () => {
            let ok = false;
            try { ok = fn(); } catch (e) { ok = false; }
            if (ok) return res(true);
            if (performance.now() - t0 > ms) return rej(new Error('timeout ' + label));
            setTimeout(tick, 50);
        };
        tick();
    });

    const urlFor = (seg, camera) => window.getFileUrl(segs[seg].files[camera]);
    const segOf = camera => {
        const src = cp.players[camera].src;
        for (let i = 0; i < segs.length; i++) if (urlFor(i, camera) === src) return i;
        return -1;
    };

    const rows = [];
    if (!cp.__r80RealNoteLoss) cp.__r80RealNoteLoss = cp.noteLoss;
    cp.noteLoss = function (camera, from, to, why) {
        const feed = cp.players[camera];
        if (rows) rows.push({
            camera, from: +(from || 0).toFixed(2), to: +(to || 0).toFixed(2),
            sec: +((to || 0) - (from || 0)).toFixed(2), why,
            feedSeg: segOf(camera), refSeg: segOf(cp.activeCamera),
            // What the guard in 1.2.119 reads, computed here independently of it.
            offFile: !!cp.currentUrls[camera] && feed.src !== cp.currentUrls[camera],
            rs: feed.readyState, dur: isFinite(feed.duration) ? +feed.duration.toFixed(2) : null,
        });
        return cp.__r80RealNoteLoss.apply(this, arguments);
    };

    const stage = async (camera, seg, localTime) => {
        const el = cp.players[camera];
        const url = urlFor(seg, camera);
        if (el.src !== url) {
            el.src = url;
            await wait(() => el.duration > 0, 12000, camera + ' metadata');
        }
        const at = Math.min(localTime, el.duration - 0.3);
        await wait(() => el.buffered.length &&
            el.buffered.end(el.buffered.length - 1) >= Math.min(at + 0.2, el.duration - 0.05),
            25000, camera + ' buffer to ' + at.toFixed(1));
        el.currentTime = at;
        await wait(() => Math.abs(el.currentTime - at) < 0.35 && !el.seeking, 12000, camera + ' seek');
        return +el.currentTime.toFixed(2);
    };

    // `SYNC_COOLDOWN_MS` is 2 s and `starvingSince` lasts 4 s: one stale timestamp from the staging seeks
    // and the corrector declines to act, which would read as "the guard worked".
    const arm = () => {
        cp.lastSyncTime = 0;
        cp.isSeeking = false;
        cp.lastRefTime = -1;
        Object.keys(cp.feedStats).forEach(k => {
            cp.feedStats[k].lastCorrection = 0;
            cp.feedStats[k].starvingSince = 0;
        });
    };

    const caseRun = async (name, setup, opts) => {
        cp.pauseAll();
        cp.isPlaying = false;
        await wait(() => cp.players.back.paused && cp.players.front.paused, 5000, name + ' pause');
        rows.length = 0;
        // Hold the corrector off while the tiles are put where the case wants them: `front.currentTime`
        // written during setup fires `timeupdate`, and that pass is setup, not the case.
        cp.isSeeking = true;
        const staged = await setup();
        arm();
        cp.isPlaying = true;
        cp.players.front.play().catch(() => {});
        cp.players.back.play().catch(() => {});
        // On the AVD `play()` on a freshly-assigned `src` can take seconds to bite, and the passes only
        // come from the reference's own `timeupdate`. Measuring before the clock moves measures nothing.
        await wait(() => cp.players.front.currentTime > staged.refAt + 0.4, 25000, name + ' ref advances');
        await new Promise(r => setTimeout(r, opts.windowMs || 10000));
        const mine = rows.filter(r => r.camera === 'back');
        cp.pauseAll();
        say(`${name}: rows=${mine.length} offFile=${mine.length ? mine[0].offFile : '-'} staged=${JSON.stringify(staged)}`);
        return { name, staged, rows: mine, jumped: mine.length > 0, feedPaused: cp.players.back.paused };
    };

    const run = async () => {
        const out = { state: 'done', cases: {} };
        cp.setLayout('grid');

        // 1 — control. Load segment 5 the way the app does, so `currentUrls` matches the tiles' `src`,
        //     then create 2.5 s of real drift. The corrector must still act.
        out.cases.onProgram = await caseRun('onProgram', async () => {
            await cp.loadSegmentForAllCameras(segs[5]);
            await wait(() => cp.feedHasPosition
                ? cp.feedHasPosition(cp.players.back) && cp.feedHasPosition(cp.players.front)
                : cp.players.back.readyState >= 2, 25000, 'both loaded');
            const feedAt = await stage('back', 5, 0.5);
            const refAt = await stage('front', 5, 3.0);
            return { feedAt, refAt, feedSeg: segOf('back'), refSeg: segOf('front'),
                offFile: cp.players.back.src !== cp.currentUrls.back };
        }, {});

        // 2 — the defect. `back` is left pointing at a file the app never handed it (segment 3's), while
        //     the reference is on segment 5. Its `currentTime` describes a different minute.
        out.cases.offProgram = await caseRun('offProgram', async () => {
            const feedAt = await stage('back', 3, 7.0);
            const refAt = await stage('front', 5, 1.0);
            return { feedAt, refAt, feedSeg: segOf('back'), refSeg: segOf('front'),
                offFile: cp.players.back.src !== cp.currentUrls.back };
        }, {});

        out.constants = { tolerance: 0.35, glideBand: 4, jumpAbove: 1.4, cooldownMs: 2000 };
        const broken = [];
        const c1 = out.cases.onProgram, c2 = out.cases.offProgram;
        if (c1.staged.offFile || c1.staged.feedSeg !== c1.staged.refSeg) broken.push('the control is not on-program/same-segment');
        if (!c1.jumped) broken.push('the control produced no correction, so nothing proves the ledger fills');
        if (c2.staged.feedSeg === c2.staged.refSeg) broken.push('the defect case is not off-segment');
        if (!c2.staged.offFile) broken.push('the defect case did not put the tile off-program');

        if (broken.length) out.verdict = 'INCONCLUSIVE: ' + broken.join('; ');
        else if (c2.jumped) out.verdict = 'DEFECT PRESENT: an off-program tile was dragged ('
            + c2.rows.map(r => `${r.from}->${r.to} ${r.sec}s rs=${r.rs}`).join(', ') + ')';
        else if (!c1.jumped) out.verdict = 'GUARD TOO BROAD: real drift stopped being corrected';
        else out.verdict = 'GUARD OK: drift corrected, off-program tile left alone';
        window.__r80cf = Object.assign(out, { steps: window.__r80cf.steps });
    };

    run().catch(e => {
        window.__r80cf = { state: 'error', message: String((e && e.message) || e), steps: window.__r80cf.steps };
    });
    return JSON.stringify({ kicked: true });
})();
