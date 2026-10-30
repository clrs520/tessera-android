// R80-1 discriminator: does the seam gate's deferred `playAll()` (the six tiles sit PAUSED for the
// ~850 ms the gate takes to close on a real phone) cost buffer depth?
//
// The 1.2.118 phone dump reads `buf=2.47–3.83` at hand-over where 1.2.117 read 13–15, but that pair is
// confounded (different run lengths, and the dump sat 0.7 s from the end of an 11.69 s tail clip). So
// instead of arguing from two dumps, this measures the one variable on its own, on one device:
// identical files, identical elapsed window, the only difference is whether the element was playing
// while it loaded.
//
//   play   — `play()` immediately (1.2.117 behaviour: no deferral)
//   gate   — `play()` after 850 ms (what 1.2.118 actually does at a boundary)
//   paused — never plays (the ceiling case, `SEAM_GATE_MS = 1800`, and what a stalled load looks like)
//
// Nine fresh files, one per trial, arms rotated so no arm owns the fast or slow files. `devtools/`
// lives at the workspace root, NOT inside TDashcamStudio. Progress lands in `window.__r80bufDone`;
// two awaits in a row is enough for CDP to time out, so the work runs detached.
(() => {
    const v = window.viewer;
    const cp = v && v.multiCameraPlayer;
    if (!v || !cp) return JSON.stringify({ err: 'no viewer' });
    const segs = (v.currentEvent && v.currentEvent.segments) || [];
    if (segs.length < 10) return JSON.stringify({ err: 'need 10 segments, have ' + segs.length });

    // Pausing the app is the whole point of the control: six live tiles decoding while a ninth element
    // loads would measure the emulator, not the buffering policy.
    cp.pauseAll();
    window.__r80bufDone = JSON.stringify({ state: 'running', idx: cp.currentSegmentIndex });

    const GATE_MS = 850;          // the phone's measured gate-close time in 1.2.118
    const SAMPLES = [1500, 3000, 6000];
    const PLAN = [
        ['play', 1], ['gate', 2], ['paused', 3],
        ['gate', 4], ['paused', 5], ['play', 6],
        ['paused', 7], ['play', 8], ['gate', 9],
    ];

    const tailOf = el => {
        try { return el.buffered.length ? el.buffered.end(el.buffered.length - 1) : 0; }
        catch (e) { return -1; }
    };

    const runTrial = (arm, seg) => new Promise(resolve => {
        const el = document.createElement('video');
        el.muted = true;
        el.playsInline = true;
        el.preload = 'auto';
        el.style.cssText = 'position:fixed;left:-2000px;top:0;width:320px;height:180px';
        document.body.appendChild(el);
        const url = window.getFileUrl(segs[seg].files.front.path);
        const t0 = performance.now();
        let playedAt = null;
        el.src = url;
        if (arm === 'play') { el.play().catch(() => {}); playedAt = 0; }
        else if (arm === 'gate') setTimeout(() => { playedAt = +(performance.now() - t0).toFixed(0); el.play().catch(() => {}); }, GATE_MS);

        const out = { arm, seg, bytes: Math.round(el.fileSize || 0), samples: [] };
        let i = 0;
        const tick = () => {
            const el2 = out;
            out.samples.push({
                at: Math.round(performance.now() - t0),
                buf: +tailOf(el).toFixed(2),
                ahead: +(tailOf(el) - el.currentTime).toFixed(2),
                t: +el.currentTime.toFixed(2),
                rs: el.readyState,
                ns: el.networkState,
            });
            i += 1;
            if (i < SAMPLES.length) setTimeout(tick, SAMPLES[i] - SAMPLES[i - 1]);
            else {
                out.dur = +(el.duration || 0).toFixed(2);
                out.playedAt = playedAt;
                out.metaAt = +(el.readyState >= 1 ? 'yes' : 'no');
                el.remove();
                el.src = '';
                resolve(out);
            }
        };
        setTimeout(tick, SAMPLES[0]);
    });

    (async () => {
        const rows = [];
        for (const [arm, seg] of PLAN) rows.push(await runTrial(arm, seg));
        const mean = (arm, at) => {
            const list = rows.filter(r => r.arm === arm)
                .map(r => { const s = r.samples.find(x => x.at >= at - 250); return s ? s.buf : null; })
                .filter(n => typeof n === 'number');
            return list.length ? +(list.reduce((s, n) => s + n, 0) / list.length).toFixed(2) : null;
        };
        const summary = {};
        ['play', 'gate', 'paused'].forEach(arm => {
            summary[arm] = {};
            SAMPLES.forEach(at => { summary[arm]['buf@' + at] = mean(arm, at); });
        });
        window.__r80bufDone = JSON.stringify({
            state: 'done', fileDuration: rows[0] && rows[0].dur, summary, rows,
        }, null, 1);
    })();

    return JSON.stringify({ kicked: true, plan: PLAN.length, pausedApp: !cp.isPlaying });
})();
