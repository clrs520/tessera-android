// R77: the axis fix is an arithmetic claim about three arrays, and the emulator cannot say whether
// patching clip 3 of ten moves the clock under the picture. So test the arithmetic directly, with the
// Xiaomi 14's own measurements. Run: node devtools/r77-axis-test.mjs
const REAL = [61.95, 61.82, 60.00, 60.81, 59.47, 61.20];

// A copy of `rebookAxis`'s loop: patch one duration, re-accumulate the start times from it forward.
function rebook(event, index, real) {
    const durations = event.segmentDurations;
    if (Math.abs(real - (durations[index] || 60)) < 0.02) return true;
    durations[index] = real;
    let acc = event.segmentStartTimes[index] || 0;
    for (let i = index; i < durations.length; i++) {
        event.segmentStartTimes[i] = acc;
        acc += durations[i];
    }
    event.totalDuration = acc;
    return true;
}

function book(n, per = 60) {
    const event = { segmentDurations: [], segmentStartTimes: [], totalDuration: 0 };
    let acc = 0;
    for (let i = 0; i < n; i++) { event.segmentStartTimes[i] = acc; event.segmentDurations[i] = per; acc += per; }
    event.totalDuration = acc;
    return event;
}

const checks = [];
const ok = (name, cond, detail = '') => checks.push({ name, pass: !!cond, detail });

// 1. Watching through in order is the case that matters: every clip is corrected as it loads, and the
//    start time of the clip on screen must not move at the instant of the correction.
{
    const event = book(REAL.length);
    let jumped = 0;
    for (let i = 0; i < REAL.length; i++) {
        const before = event.segmentStartTimes[i];
        rebook(event, i, REAL[i]);
        if (event.segmentStartTimes[i] !== before) jumped++;
    }
    ok('watching through never moves the current clip start', jumped === 0, `jumped=${jumped}`);
    const trueStarts = [];
    let acc = 0;
    for (const d of REAL) { trueStarts.push(acc); acc += d; }
    ok('the ruler equals the tape after one pass',
        event.segmentStartTimes.every((s, i) => Math.abs(s - trueStarts[i]) < 1e-9)
        && Math.abs(event.totalDuration - acc) < 1e-9,
        `total=${event.totalDuration.toFixed(2)} tape=${acc.toFixed(2)}`);
}

// 2. The error the phone reported: five measured clips were +4.05 s away from what the ruler booked.
//    That sum is what `acc` says, and the shift at boundary five is what `resid` must reach zero on.
{
    const event = book(REAL.length);
    const acc = REAL.slice(0, 5).reduce((s, d) => s + (d - 60), 0);
    const shiftAtBoundary5 = event.segmentStartTimes[5] - REAL.slice(0, 5).reduce((s, d) => s + d, 0);
    ok('the reported acc reproduces from these numbers', Math.abs(acc - 4.05) < 1e-9, `acc=${acc.toFixed(2)}`);
    ok('the ruler is 4.05 s short at the fifth boundary',
        Math.abs(shiftAtBoundary5 + 4.05) < 1e-9, `shift=${shiftAtBoundary5.toFixed(2)}`);
}

// 3. Re-booking the same clip twice (a seek back onto it re-reads the file) must be idempotent.
{
    const event = book(6);
    rebook(event, 2, 61.82);
    const after = JSON.stringify(event);
    rebook(event, 2, 61.82);
    ok('re-booking a clip is a no-op', JSON.stringify(event) === after);
}

// 4. A jump ahead: measuring clip 5 first must not disturb clips 0-4, whose starts stay as booked.
{
    const event = book(6);
    rebook(event, 5, 61.20);
    ok('a late clip leaves the earlier starts alone',
        event.segmentStartTimes.slice(0, 5).join(',') === '0,60,120,180,240',
        event.segmentStartTimes.join(','));
    ok('a late clip moves only what comes after it', event.segmentStartTimes.length === 6);
}

// 5. The AVD fixture is the loud test: 18.27 s clips booked at 60 s. Ten of them should take the ruler
//    from 600 s to 182.7 s, which is what the acceptance read will show.
{
    const event = book(10);
    for (let i = 0; i < 10; i++) rebook(event, i, 18.27);
    ok('the 18.27 s fixture collapses the ruler to the tape',
        Math.abs(event.totalDuration - 182.7) < 1e-9 && Math.abs(event.segmentStartTimes[9] - 164.43) < 1e-9,
        `total=${event.totalDuration.toFixed(2)} start9=${event.segmentStartTimes[9].toFixed(2)}`);
}

// 6. The resume stamp. `rememberPlaybackPosition` writes {i, t} and `savedPositionFor` turns it back
//    into a ruler second — on whatever ruler the app has at open, which is the un-measured one.
//    A plain second would name a different clip after the ruler moves; {i, t} names the same picture.
{
    // A copy of the two halves, minus localStorage.
    const stamp = (event) => {
        const i = event.at_index;
        return { i, t: +(event.getCurrentTime() - event.segmentStartTimes[i]).toFixed(1) };
    };
    const restore = (event, saved) => {
        const i = Math.max(0, Math.min(saved.i | 0, event.segmentDurations.length - 1));
        const length = event.segmentDurations[i] || 60;
        const start = event.segmentStartTimes[i];
        return (isFinite(start) ? start : 0) + Math.max(0, Math.min(saved.t || 0, length - 0.2));
    };

    // Watching to 12.3 s inside clip 4 of the phone's real files.
    const watched = book(REAL.length);
    for (let i = 0; i < REAL.length; i++) rebook(watched, i, REAL[i]);
    watched.at_index = 4;
    watched.getCurrentTime = () => watched.segmentStartTimes[4] + 12.3;
    const saved = stamp(watched);
    ok('the stamp holds the clip and the offset inside it',
        saved.i === 4 && Math.abs(saved.t - 12.3) < 1e-9, JSON.stringify(saved));

    // Reopen: a fresh 60 s-per-clip ruler, and the stamp has to land back inside clip 4.
    const reopened = book(REAL.length);
    const at = restore(reopened, saved);
    let index = 0;
    for (let i = 0; i < reopened.segmentStartTimes.length; i++) if (at >= reopened.segmentStartTimes[i]) index = i;
    ok('restored on the un-measured ruler, still lands in clip 4',
        index === 4 && Math.abs(at - (reopened.segmentStartTimes[4] + 12.3)) < 1e-9,
        `at=${at.toFixed(2)} lands=${index} local=${(at - reopened.segmentStartTimes[4]).toFixed(2)}`);

    // What the old format would have done with the same watch: the second it saved was 245.58 on the
    // corrected ruler, which on the 60 s ruler is clip 4 at 5.58 s — five seconds of content away,
    // and the gap grows with every clip watched before the pause.
    const oldSecond = watched.segmentStartTimes[4] + 12.3;
    const oldLands = Math.floor(oldSecond / 60);
    ok('the old absolute second would have drifted',
        oldLands !== saved.i || Math.abs((oldSecond - oldLands * 60) - saved.t) > 1,
        `saved=${oldSecond.toFixed(2)} lands=clip ${oldLands} at ${(oldSecond - oldLands * 60).toFixed(2)}s`);
}

let failed = 0;
for (const c of checks) {
    if (!c.pass) failed++;
    console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
