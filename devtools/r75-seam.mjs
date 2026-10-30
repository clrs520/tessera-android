// R75: does a *non-front* tile go frameless at the splice? R74's instrument only ever read
// `#front-player`, and front is the one feed the R64-1 reload always keeps loaded (the transport clock
// and 「播完自动下一个」 read it). So "0 blank windows" was six feeds' worth of evidence for one feed.
// This samples every tile in the player area — composited the way the user sees it (video first,
// `.feed-hold` painted on top) — and counts a frameless stretch only on a tile that is actually on
// screen. It also reports how far the held snapshot had to be upscaled, which is what decides whether
// `HELD_FRAME_WIDTH = 480` is a soft frame on a real phone.
//
// Aggregation happens in the page: a 40 s run at rAF fidelity is ~14k rows x 6 feeds, which is not
// something to drag across CDP. Only windows and counters come back.
//
//   node devtools/r75-seam.mjs auto-shipped   (whatever the installed APK does)
//   node devtools/r75-seam.mjs auto-off       (control: snapshot never taken -> windows must appear)
//
// Always pair them: a 0 for the other five feeds means nothing without a run where the probe can see
// those same five go blank.
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;
const MODE = process.argv[2] || 'auto-shipped';
const RUN_MS = Number(process.argv[3] || 40000);

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
    setTimeout(() => { pending.delete(id); rej(new Error(`${method} timed out`)); }, 20000);
    ws.send(JSON.stringify({ id, method, params }));
});
const evalIn = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) return 'EX ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
};

const CAMS = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];

const install = `(() => {
    if (window.__r75) window.__r75.running = false;
    const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const g = c.getContext('2d', { willReadFrequently: true });
    // Read the tiles off the DOM: the video ids use hyphens (left-pillar-player) while the camera
    // keys use underscores (left_pillar), so a constructed id silently misses two feeds.
    const feeds = Array.from(document.querySelectorAll('.video-container video')).map(p => {
        const box = p.closest('.video-container');
        return { cam: (box && (box.dataset.camera || box.id)) || p.id, p, box };
    }).filter(f => f.p && f.box);
    const st = {};
    feeds.forEach(f => st[f.cam] = { frames: 0, onscreen: 0, holdFrames: 0, blankOnscreen: 0,
        splices: 0, windows: [], open: null, upscale: 0, holdOnBlank: 0 });
    const me = window.__r75 = { running: true, feeds: feeds.length, st: st, frames: 0, t0: performance.now() };
    // A tile the current layout cannot show is *not* a blank: it is deliberately not loaded (R64-1).
    // Only a tile with real on-screen area can flash.
    const onScreen = (box) => {
        const r = box.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return 0;
        const s = getComputedStyle(box);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return 0;
        return 1;
    };
    const srcHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
        return (h >>> 0).toString(36).padStart(7, '0'); };
    const tick = () => {
        if (!me.running || window.__r75 !== me) return;
        const now = performance.now() - me.t0;
        me.frames++;
        for (const f of feeds) {
            const k = st[f.cam];
            k.frames++;
            let alpha = 0, hold = 0, up = 0, blank = 0;
            g.clearRect(0, 0, 8, 8);
            try {
                g.drawImage(f.p, 0, 0, 8, 8);
                const h = f.box.querySelector('.feed-hold');
                if (h) { hold = 1; g.drawImage(h, 0, 0, 8, 8);
                    up = (f.box.getBoundingClientRect().width * window.devicePixelRatio) / h.width; }
                const d = g.getImageData(0, 0, 8, 8).data;
                let n = 0, a = 0;
                for (let i = 0; i < d.length; i += 4) { n++; if (d[i + 3] > 8) a++; }
                alpha = a / n;
            } catch (e) { /* nothing to draw */ }
            blank = alpha < 0.5;
            if (hold) { k.holdFrames++; if (up > k.upscale) k.upscale = up; }
            const vis = onScreen(f.box);
            if (vis) k.onscreen++;
            if (vis && blank) {
                k.blankOnscreen++;
                if (hold) k.holdOnBlank++;
                if (k.open === null) k.open = { t: now, src: srcHash(f.p.currentSrc || ''), rs: f.p.readyState };
            } else if (k.open !== null) {
                k.windows.push({ from: k.open.t, to: now, ms: +(now - k.open.t).toFixed(0),
                    fromSrc: k.open.src, toSrc: srcHash(f.p.currentSrc || ''), holdFrames: 0,
                    startRs: k.open.rs });
                k.open = null;
            }
            const s = srcHash(f.p.currentSrc || '');
            if (k.lastSrc !== undefined && s !== k.lastSrc) k.splices++;
            k.lastSrc = s;
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return 'recorder installed on ' + feeds.length + ' tiles, dpr=' + window.devicePixelRatio;
})()`;

console.log(await evalIn(install));
await new Promise(r => setTimeout(r, 400));

if (MODE.endsWith('off')) {
    console.log(await evalIn(`(() => { viewer.multiCameraPlayer.holdFeedFrames = function () {};
        return 'hold disabled: no snapshot will be taken'; })()`));
}

const pre = await evalIn(`(() => { const m = viewer.multiCameraPlayer, cp = viewer.continuousPlayer;
    const p = m.players.front;
    return JSON.stringify({ segs: viewer.currentEvent ? viewer.currentEvent.segments.length : 0,
        idx: cp.currentSegmentIndex, layout: m.layoutMode, vis: m.visibleCameras().length,
        playing: !p.paused, left: +((p.duration - p.currentTime)).toFixed(1),
        secsLeft: +((cp.totalDuration || 0) - ((cp.segmentStartTimes || [])[cp.currentSegmentIndex] || 0)
            - p.currentTime).toFixed(1) }); })()`);
console.log('pre:', String(pre));
if (String(pre).startsWith('EX') || pre === undefined) { console.error('pre-check failed'); process.exit(1); }

console.log('waiting for natural splices (no manual call)');
await new Promise(r => setTimeout(r, RUN_MS));
console.log(await evalIn('(() => { window.__r75.running = false; return "stopped"; })()'));

const summary = JSON.parse(String(await evalIn(`(() => {
    // An open window at stop time is a live blank; report it as such rather than dropping it.
    const me = window.__r75; const now = performance.now() - me.t0;
    Object.keys(me.st).forEach(k => { const s = me.st[k];
        if (s.open !== null) { s.windows.push({ from: s.open.t, to: now, ms: +(now - s.open.t).toFixed(0),
            fromSrc: s.open.src, toSrc: '(still blank)', startRs: s.open.rs, open: 1 }); s.open = null; } });
    return JSON.stringify({ frames: me.frames, st: me.st }); })()`)));
const st = summary.st;
console.log(`\n${MODE}: ${summary.frames} frames sampled`);
let anySplice = 0;
for (const cam of Object.keys(st)) {
    const k = st[cam];
    anySplice += k.splices;
    const spliceWindows = k.windows.filter(w => w.toSrc !== w.fromSrc);
    const longest = spliceWindows.reduce((a, w) => Math.max(a, w.ms), 0);
    console.log(`${cam.padEnd(12)} onscreen=${String(k.onscreen).padStart(5)}/${k.frames}`
        + ` holdFrames=${String(k.holdFrames).padStart(5)} blankOnscreen=${String(k.blankOnscreen).padStart(5)}`
        + ` holdButBlank=${k.holdOnBlank} splices=${k.splices} spliceWindows=${spliceWindows.length}`
        + ` longest=${longest}ms upscale=${k.upscale.toFixed(2)}x`);
    for (const w of k.windows) {
        if (w.toSrc === w.fromSrc && !w.open) continue;
        console.log(`    ${w.from.toFixed(0)}->${w.to.toFixed(0)} = ${w.ms} ms rs=${w.startRs}`
            + (w.open ? ' OPEN AT END' : ` spliced ${w.fromSrc}->${w.toSrc}`));
    }
}
if (!anySplice) {
    console.error('\nVOID RUN: no file changed underneath any tile — the clip was not crossing a seam. '
        + 'Start playback so a segment boundary is reached inside the window.');
    process.exit(1);
}
console.log(`\n${MODE}: ${anySplice} file change(s) observed across all tiles`);
ws.close();
