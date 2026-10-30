// R76: the user's words are 「感觉中间缺少几秒钟的画面」 — missing *content*, not a rendering glitch.
// Reading the code there are three ways a 1-minute seam can throw picture away, and they need
// different numbers to tell apart:
//   (a) correctTouchFeed writes `currentTime = refTime` on a laggard: everything between where it was
//       and where it is put is never painted;
//   (b) `front`'s `ended` is the only trigger that advances the event, so the other five feeds are cut
//       at whatever `duration - currentTime` they still hold;
//   (c) calculateEventDurations books every segment at 60 s, so if a real clip is 59.9/60.1 s the axis
//       (and every seek built on it) slides away from the content the progress bar claims.
// The app now keeps its own ledgers (`describeLoss`, `describeHolds`, `describeAxis`). This probe does
// two things with them: it first *checks the arithmetic* of the instrument itself — an instrument that
// silently reads zero is worse than none, and on a phone the ledger is all we will ever get — and then
// measures the same splices from outside, per feed, in the feed's own file-seconds:
//   tail  = seconds of the outgoing file that were left unplayed
//   head  = seconds into the incoming file the first painted frame lands
//   skip  = tail + head  (content of the recording that was on disk and never shown)
//   gapMs = wall-clock freeze between the two
// If the probe's `skip` and the app's `lost` agree, a single 「复制诊断」 from the Xiaomi settles which
// of (a)/(b)/(c) dominates. If they disagree, the instrument is wrong and gets fixed first.
//
//   node devtools/r76-skip.mjs check      (arithmetic only, no playback needed)
//   node devtools/r76-skip.mjs measure    (>=2 natural minute crossings while playing)
//
// measure needs a six-feed landscape grid already playing; it refuses to set that up itself, because a
// probe that boots its own playback can quietly measure a different situation than the one reported.
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;
const MODE = process.argv[2] || 'measure';
const RUN_MS = Number(process.argv[3] || 90000);
const TARGET_SPLICES = 2;

const pid = execFileSync(ADB, ['shell', 'pidof', APP_ID], { encoding: 'utf8' }).trim();
if (!pid) { console.error('app is not running'); process.exit(1); }
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);
const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then(r => r.json());
const page = pages.find(p => p.type === 'page');
if (!page) { console.error('no inspectable page'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('connect timed out')), 8000);
    ws.addEventListener('open', () => { clearTimeout(t); res(); });
    ws.addEventListener('error', () => { clearTimeout(t); rej(new Error('connect failed')); });
});
let nextId = 1; const pending = new Map();
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => { pending.delete(id); rej(new Error(`${method} timed out`)); }, 30000);
    ws.send(JSON.stringify({ id, method, params }));
});
const evalIn = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) return 'EX ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
};
// A page-side throw must never be read as "the ledger is empty": that is exactly the false-clean the
// R74 round got bitten by, where a dead app measured as a passing baseline.
const evalJson = async (label, expression) => {
    const raw = String(await evalIn(expression));
    if (raw.startsWith('EX') || raw === 'undefined') {
        console.error(`${label} failed in the page:\n  ${raw}\n`
            + 'The probe cannot tell loss from a broken probe while this call throws. Fix the call first.');
        process.exit(1);
    }
    return JSON.parse(raw);
};

// The instrument has to prove it can see before its silence can mean anything. Every check below is a
// number the ledger must reproduce; `want` is what the arithmetic says it should be.
const checks = `(() => {
    const mcp = viewer.multiCameraPlayer, cp = viewer.continuousPlayer;
    const r = [];
    const bad = [];
    const test = (name, got, want) => {
        const ok = typeof want === 'string' ? got === want : Math.abs(got - want) < 0.06;
        r.push((ok ? '  ok   ' : '  FAIL ') + name + ' = ' + got + (ok ? '' : ' (want ' + want + ')'));
        if (!ok) bad.push(name);
    };
    // Ledger state is destroyed on purpose: the real measurement starts after this and must begin at 0.
    mcp.lossLog = []; Object.keys(mcp.feedStats).forEach(k => { mcp.feedStats[k].lost = 0; mcp.feedStats[k].lostJumps = 0; });

    mcp.noteLoss('front', 10, 13.5, 'self-check');
    test('a 3.5s forward write records', mcp.feedStats.front.lost, 3.5);
    test('...as one jump', mcp.feedStats.front.lostJumps, 1);

    mcp.noteLoss('front', 20, 20.02, 'self-check');
    test('0.02s under the epsilon is ignored (entries)', mcp.lossLog.length, 1);

    mcp.noteLoss('back', 30, 25, 'self-check');
    test('a backwards write is logged', mcp.lossLog.length, 2);
    test('...but credits no loss', mcp.feedStats.back.lost, 0);

    const txt = mcp.describeLoss();
    test('describeLoss prints totals', /total front=3\\.50s\\/1/.test(txt.join('\\n')), true);
    // The seg field sits between the camera and the pair, so a regex expecting them adjacent fails the
    // probe, not the ledger — that difference is the whole reason this check exists.
    test('...newest entry last', /back seg=\\S+ 30\\.00->25\\.00 -5\\.00 self-check/.test(txt[txt.length - 1]), true);

    // The boundary tail: gated on the automatic crossing, and equal to the file's unplayed remainder.
    const cam = Object.keys(mcp.players).find(k => { const p = mcp.players[k];
        return p && Number.isFinite(p.duration) && p.duration > 0 && (p.currentSrc || p.src); });
    if (!cam) { r.push('  FAIL no loaded feed to test boundary-tail against'); bad.push('no-feed'); }
    else {
        const p = mcp.players[cam];
        cp.isTransitioning = false;
        mcp.noteBoundaryTail([cam]);
        test('a user drag counts as no loss', mcp.lossLog.length, 2);
        cp.isTransitioning = true;
        const want = p.duration - p.currentTime;
        mcp.noteBoundaryTail([cam]);
        const e = mcp.lossLog[mcp.lossLog.length - 1];
        test('boundary-tail = duration - currentTime', e && e.why === 'boundary-tail' ? e.sec : NaN, want);
        cp.isTransitioning = false;
    }
    mcp.lossLog = []; Object.keys(mcp.feedStats).forEach(k => { mcp.feedStats[k].lost = 0; mcp.feedStats[k].lostJumps = 0; });
    if (!isTouchShellRuntime()) r.push('  NOTE isTouchShellRuntime() is false here: the ledgers stay empty by design');
    return JSON.stringify({ lines: r, failed: bad });
})()`;

const parsedChecks = await evalJson('instrument self-check', checks);
console.log(`instrument self-check (${MODE}):`);
parsedChecks.lines.forEach(l => console.log(l));
if (parsedChecks.failed.length) {
    console.error('\nThe ledger cannot reproduce its own arithmetic: ' + parsedChecks.failed.join(', ')
        + '. Fix the instrument before trusting any number off the phone.');
    process.exit(1);
}
if (MODE === 'check') { ws.close(); process.exit(0); }

const pre = await evalJson('pre-check', `(() => {
    const m = viewer.multiCameraPlayer, cp = viewer.continuousPlayer, p = m.players.front;
    if (!cp) return JSON.stringify({ segs: 0, playing: false, layout: m.layoutMode, vis: 0 });
    // The play flag lives on MultiCameraPlayer; continuousPlayer.isPlaying is undefined, and a probe
    // that reads the wrong one silently measures a paused player.
    return JSON.stringify({ segs: viewer.currentEvent ? viewer.currentEvent.segments.length : 0,
        idx: cp.currentSegmentIndex, playing: m.isPlaying, layout: m.layoutMode,
        vis: m.visibleCameras().length, dur: p ? p.duration : 0, t: p ? p.currentTime : 0 });
})()`);
console.log('\npre:', JSON.stringify(pre));
if (pre.segs < 2 || !pre.playing) {
    console.error('\nNOT MEASURABLE: needs an event with 2+ segments that is *playing* in a six-feed grid. '
        + 'Rotate to landscape, pick the 6-grid, press play, then re-run. '
        + 'A run that crossed no boundary reads every ledger as 0 and proves nothing.');
    process.exit(1);
}

const install = `(() => {
    if (window.__r76) window.__r76.running = false;
    const srcHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
        return (h >>> 0).toString(36).padStart(7, '0'); };
    // DOM, not constructed ids: video elements are \`left-pillar-player\` while camera keys are
    // \`left_pillar\`, and a guessed id silently drops two feeds out of the run.
    const feeds = Array.from(document.querySelectorAll('.video-container video')).map(p => {
        const box = p.closest('.video-container');
        return { cam: (box && (box.dataset.camera || box.id)) || p.id, p };
    }).filter(f => f.p && f.cam);
    const me = window.__r76 = { running: true, feeds: feeds.length, splices: {}, rows: [],
        st: {}, t0: performance.now() };
    feeds.forEach(f => me.st[f.cam] = { n: 0, last: null, open: null, done: 0 });
    const tick = () => {
        if (!me.running || window.__r76 !== me) return;
        const now = performance.now() - me.t0;
        for (const f of feeds) {
            const k = me.st[f.cam]; const p = f.p;
            k.n++;
            const src = srcHash(p.currentSrc || p.src || '');
            // The outgoing file's last honest sample: recorded every frame while this src was live,
            // so the boundary cut is measured from what the element actually held, not from a guess.
            if (Number.isFinite(p.duration) && p.duration > 0) k.last = { src, t: p.currentTime, dur: p.duration, at: now };
            if (k.open) {
                // The incoming file only "shows" once it has a frame and is running again; until then
                // the tile is the still snapshot, and that span is the freeze the eye sees.
                if (p.readyState >= 2 && !p.paused) {
                    const o = k.open;
                    k.open = null; k.done++;
                    me.rows.push({ cam: f.cam, tail: o.tail, head: +p.currentTime.toFixed(2),
                        skip: +(o.tail + p.currentTime).toFixed(2), gapMs: +(now - o.at).toFixed(0),
                        seg: viewer.continuousPlayer.currentSegmentIndex });
                } else if (now - o.at > 60000) {
                    k.open = null; k.done++;
                    me.rows.push({ cam: f.cam, tail: o.tail, head: NaN, skip: NaN,
                        gapMs: 60000, seg: viewer.continuousPlayer.currentSegmentIndex, never: 1 });
                }
            } else if (k.last && src !== k.last.src) {
                k.open = { at: k.last.at, tail: +(k.last.dur - k.last.t).toFixed(2) };
            }
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return 'recorder on ' + feeds.length + ' tiles, idx=' + viewer.continuousPlayer.currentSegmentIndex;
})()`;

console.log(await evalIn(install));
console.log(`waiting up to ${RUN_MS / 1000}s for ${TARGET_SPLICES} natural minute crossings`);

let elapsed = 0;
const poll = `(() => {
    const cp = viewer.continuousPlayer;
    const f = window.__r76 ? (window.__r76.st.front || { done: -1 }) : { done: -1 };
    return JSON.stringify({ idx: cp ? cp.currentSegmentIndex : -1, done: f.done,
        running: window.__r76 && window.__r76.running ? 1 : 0 });
})()`;
while (elapsed < RUN_MS) {
    await new Promise(r => setTimeout(r, 3000)); elapsed += 3000;
    const idx = await evalJson('poll', poll);
    if (idx.done >= TARGET_SPLICES) break;
    if (!idx.running) { console.error('recorder was replaced mid-run (page reloaded?)'); process.exit(1); }
}

const summary = await evalJson('summary', `(() => {
    window.__r76.running = false;
    const me = window.__r76;
    // A splice caught open at stop time is a feed still frozen on the still: count it, do not drop it.
    Object.keys(me.st).forEach(cam => { const k = me.st[cam];
        if (k.open) me.rows.push({ cam, tail: k.open.tail, head: NaN, skip: NaN,
            gapMs: +(performance.now() - me.t0 - k.open.at).toFixed(0), open: 1 }); });
    return JSON.stringify({ rows: me.rows, frames: me.st.front ? me.st.front.n : 0 });
})()`);

console.log(`\nfront sampled ${summary.frames} frames; ${summary.rows.length} feed-boundaries observed`);
const byCam = {};
summary.rows.forEach(row => { (byCam[row.cam] = byCam[row.cam] || []).push(row); });
for (const cam of Object.keys(byCam)) {
    const rs = byCam[cam];
    const skip = rs.filter(r => Number.isFinite(r.skip)).reduce((a, r) => a + r.skip, 0);
    console.log(`\n${cam}: ${rs.length} boundary(ies), ${skip.toFixed(2)} s of its own file never shown`);
    rs.forEach(r => console.log(`    seg=${r.seg} tail=${r.tail} head=${r.head} skip=${r.skip}`
        + ` freeze=${r.gapMs}ms` + (r.never ? ' NEVER-CAME-BACK' : '') + (r.open ? ' STILL-FROZEN-AT-END' : '')));
}
const front = byCam.front || [];
if (!front.length) {
    console.error('\nVOID RUN: front never crossed a minute boundary inside the window, so every ledger '
        + 'below reads its history from before this run and proves nothing about the splice.');
    process.exit(1);
}

const ledger = await evalJson('ledgers', `(() => {
    const mcp = viewer.multiCameraPlayer, cp = viewer.continuousPlayer;
    return JSON.stringify({ loss: mcp.describeLoss(), holds: mcp.describeHolds(),
        axis: cp.describeAxis ? cp.describeAxis() : ['(no describeAxis)'],
        feeds: mcp.describeFeeds ? mcp.describeFeeds() : [],
        errs: (viewer.recentErrors || []).slice(-6) });
})()`);
const print = (title, arr) => { console.log(`\n${title}:`); (arr || []).forEach(l => console.log('  ' + l)); };
print('lost (app ledger: seconds never shown)', ledger.loss);
print('holds (snapshot overlay: t= where the new file really is, ref= event clock)', ledger.holds);
print('axis (loaded clip vs the 60s the timeline books)', ledger.axis);
print('feeds (L= is this feed\'s own loss total)', ledger.feeds);
print('recentErrors', ledger.errs);

const appTotal = await evalJson('app totals', `(() => {
    const s = viewer.multiCameraPlayer.feedStats;
    return JSON.stringify(Object.keys(s).reduce((a, k) => { a[k] = +s[k].lost.toFixed(2); return a; }, {}));
})()`);
console.log('\nprobe skip vs app lost per feed (they should be same order; a probe-only number means the '
    + 'loss came from a path the ledger does not watch, e.g. the boundary tail):');
for (const cam of Object.keys(byCam)) {
    const rs = byCam[cam].filter(r => Number.isFinite(r.skip));
    const probe = rs.reduce((a, r) => a + r.skip, 0);
    console.log(`  ${cam.padEnd(12)} probe=${probe.toFixed(2)}s  app-lost=${appTotal[cam]}s`);
}
ws.close();
