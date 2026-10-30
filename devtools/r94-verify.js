// R94 acceptance: the two things this round added are both diagnostics, so the test is that the
// pasted report actually carries them — not that a function exists. The report is captured by
// overriding console.log around copyDiagnostics(), which is the same text the clipboard gets.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (name, cond, detail) => (cond ? out.pass : out.fail).push(name + (detail === undefined ? '' : ' = ' + detail));

    // ---- A: the boot timeline ----
    const boot = describeBoot();
    ok('A describeBoot prints', /^boot /.test(boot), boot.slice(0, 150));
    ok('A ready marked at pageReady', /ready=\d+/.test(boot), (boot.match(/ready=\d+/) || ['missing'])[0]);
    ok('A list marked with the row count', /list=\d+:\d+/.test(boot), (boot.match(/list=\S+/) || ['missing'])[0]);
    ok('A the browser paint marks rode along', /fp=|fcp=/.test(boot), (boot.match(/(fp|fcp)=\d+/g) || []).join(','));
    ok('A dcl/load printed', /dcl=\d+/.test(boot), (boot.match(/dcl=\d+ load=\d+/) || ['missing'])[0]);

    // open/play only exist once a clip has actually been opened, so drive one now.
    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || (v.eventGroups || [])[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(500);
    v.multiCameraPlayer.setLayout('grid');
    await v.multiCameraPlayer.playAll();
    for (let i = 0; i < 40 && !v.multiCameraPlayer.isPlaying; i += 1) await sleep(500);
    await sleep(1500);
    const boot2 = describeBoot();
    ok('A open marked by the tap', /open=\d+/.test(boot2), (boot2.match(/open=\d+/) || ['missing'])[0]);
    ok('A play marked when a feed started', /play=\d+/.test(boot2), (boot2.match(/play=\d+/) || ['missing'])[0]);
    const ms = (s, name) => { const m = boot2.match(new RegExp(name + '=(\\d+)')); return m ? Number(m[1]) : NaN; };
    ok('A the marks are in the order a person experiences them',
        ms(boot2, 'ready') <= ms(boot2, 'list') && ms(boot2, 'list') <= ms(boot2, 'open') && ms(boot2, 'open') <= ms(boot2, 'play'),
        ['ready', 'list', 'open', 'play'].map(n => `${n}=${ms(boot2, n)}`).join(' '));
    ok('A nothing marked negative or absurd',
        ['ready', 'list', 'open', 'play'].every(n => ms(boot2, n) >= 0 && ms(boot2, n) < 600000), boot2.slice(0, 120));

    // ---- B: the hold line has to say whether a frame was presented ----
    const cp = v.continuousPlayer;
    const seg0 = cp.currentSegmentIndex;
    for (let i = 0; i < 100 && cp.currentSegmentIndex === seg0; i += 1) await sleep(500);
    // The gate holds all six tiles and releases them together, so reading `holdLog` the instant the
    // segment index moves finds every tile still standing and no released line at all.
    await sleep(4000);
    const m = v.multiCameraPlayer;
    // Released entries and live ones are two different claims, and the first version of this check
    // mixed them: `describeHolds()` puts the standing tiles last, so `slice(-3)` only ever sampled
    // STILL-STANDING and reported "0 of 10 carry pf" while the released lines carried it fine.
    const released = m.holdLog.filter(e => !e.skip);
    const relLines = m.describeHolds().slice(0, m.holdLog.length);
    ok('B a splice happened and releases logged it', released.length > 0,
        `seg ${seg0}->${cp.currentSegmentIndex}, ${released.length} released`);
    const frameLines = released.map((e, i) => e.end === 'frame' ? relLines[m.holdLog.indexOf(e)] : '')
        .filter(Boolean);
    const frameWithPf = frameLines.filter(l => /\bpf=\d+\b/.test(l));
    ok('B every frame-release reports pf=', frameLines.length === 0 || frameWithPf.length === frameLines.length,
        `${frameWithPf.length}/${frameLines.length}`);
    ok('B pf reads as a frame count, not a placeholder',
        frameWithPf.every(l => /pf=([1-9]\d*|0)\b/.test(l)), (frameWithPf[0] || '').slice(0, 170));
    const standing = m.describeHolds().filter(l => /STILL-STANDING/.test(l));
    ok('B a standing tile reports pf too', standing.length === 0 || standing.every(l => /\bpf=\d+\b/.test(l)),
        `${standing.filter(l => /\bpf=\d+\b/.test(l)).length}/${standing.length}`);
    // The point of the field: an `rs=1` hand-over must now be judgeable.
    const rs1 = m.describeHolds().filter(l => /\brs=1\b/.test(l));
    ok('B any rs=1 hand-over carries its own verdict',
        rs1.every(l => /\bpf=/.test(l)), `${rs1.length} such lines on this device`);
    out.rs1 = rs1.slice(0, 3);
    out.sample = m.describeHolds().filter(l => /pf=/.test(l)).slice(-4);

    // ---- the report itself ----
    const real = console.log;
    let captured = '';
    // The report is logged as one already-joined string, so the text lives inside argument 0.
    console.log = (...a) => {
        const first = String(a[0]);
        if (first.startsWith('[diagnostics]')) captured = first.replace('[diagnostics]', '');
        else real.apply(console, a);
    };
    try { await v.copyDiagnostics(); } finally { console.log = real; }
    ok('A the copied report carries the boot line', /^boot /m.test(captured) || /\nboot /.test(captured),
        (captured.match(/^boot .*$/m) || ['ABSENT'])[0].slice(0, 150));
    ok('B the copied report carries the holds block', /holds \(newest last/.test(captured),
        (captured.match(/holds \([^)]*\)/) || ['ABSENT'])[0]);
    ok('no new uncaught errors', (window.__r93err || []).length === 0, JSON.stringify((window.__r93err || []).slice(0, 2)));
    ok('the app recorded no errors this session', (v.recentErrors || []).length === 0, JSON.stringify(v.recentErrors));

    return JSON.stringify(out, null, 1);
})();
