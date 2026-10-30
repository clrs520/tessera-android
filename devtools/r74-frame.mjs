// R74: how long does the front feed genuinely present no frame across a splice?
// Neither CDP screenshots nor `adb screencap` contain the video surface on this emulator (both read
// the tile as flat #111), so the instrument is per-frame canvas readback: drawImage() of a media
// element with nothing to present leaves the cleared canvas transparent, which makes the alpha
// channel a direct "is there a frame" signal, sampled every animation frame.
//   node devtools/r74-frame.mjs blank        (fire playNextSegment, read the front feed only)
//   node devtools/r74-frame.mjs bare         (cleanup() patched so src is never emptied)
//   node devtools/r74-frame.mjs auto-hold    (wait for the natural `ended`, R74 fix injected live)
//   node devtools/r74-frame.mjs auto-off     (wait for the natural `ended`, shipped hold disabled)
//   node devtools/r74-frame.mjs auto-shipped (wait for the natural `ended`, whatever the APK does)
// `blank`/`bare` are dead on the installed build — `viewer.playNextSegment` is not exposed there, so a
// manual fire finds no seam. Use one of the `auto-*` modes, and always pair `auto-shipped` with
// `auto-off` so a 0 ms reading can be told apart from a probe that stopped seeing the seam.
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;
const MODE = process.argv[2] || 'blank';
const RUN_MS = Number(process.argv[3] || 3500);

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
    setTimeout(() => { pending.delete(id); rej(new Error(`${method} timed out`)); }, 15000);
    ws.send(JSON.stringify({ id, method, params }));
});
const evalIn = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) return 'EX ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
};

const install = `(() => {
    // Zombie guard. Every loop reads the flag off the *global*, so a recorder installed by an earlier
    // run keeps pushing into the new run's rows array (mixed-length rows, two clocks in one table)
    // unless the loop also checks that the global is still its own object.
    if (window.__r74) window.__r74.running = false;
    const p = document.querySelector('#front-player');
    const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const g = c.getContext('2d', { willReadFrequently: true });
    const me = window.__r74 = { rows: [], running: true, t0: 0 };
    const tick = () => {
        if (!me.running || window.__r74 !== me) return;
        g.clearRect(0, 0, 8, 8);
        let alpha = 0, mean = -1, spread = -1;
        try {
            g.drawImage(p, 0, 0, 8, 8);
            // The tile composites the held frame over the video, so "what the user can see" has to be
            // read back the same way — otherwise the instrument reports the blank the R74 fix was
            // written to cover. Asked in every mode: an old build simply has no overlay to draw.
            const hold = p.closest('.video-container').querySelector('.feed-hold');
            if (hold) g.drawImage(hold, 0, 0, 8, 8);
            const d = g.getImageData(0, 0, 8, 8).data;
            let s = 0, sq = 0, n = 0, a = 0;
            for (let i = 0; i < d.length; i += 4) {
                const v = (d[i] + d[i + 1] + d[i + 2]) / 3;
                s += v; sq += v * v; n++; if (d[i + 3] > 8) a++;
            }
            alpha = a / n; mean = s / n; spread = Math.sqrt(Math.max(0, sq / n - mean * mean));
        } catch (e) { /* tainted or nothing to draw */ }
        me.rows.push([+(performance.now() - me.t0).toFixed(0),
            +alpha.toFixed(2), +mean.toFixed(1), +spread.toFixed(1),
            p.readyState, p.videoWidth, p.paused ? 1 : 0, +p.currentTime.toFixed(2),
            // Identity of the file, not of the camera: every front clip's encoded path shares its date
            // prefix and its -front.mp4 tail, so a slice of either end survives a splice unchanged.
            // Hash the whole URL instead — it is per-file, and stable while a file is loaded.
            (() => { let h = 0; const s = p.currentSrc; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
                return (h >>> 0).toString(36).padStart(7, '0'); })()]);
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return 'recorder installed';
})()`;

console.log(await evalIn(install));
await new Promise(r => setTimeout(r, 500));

// A splice needs the recorder's zero point set at the splice itself.
if (MODE.endsWith('bare')) {
    console.log(await evalIn(`(() => {
        const m = viewer.multiCameraPlayer;
        m.cleanup = function () {
            this.pauseAll();
            this.suspendedFeeds.clear();
            Object.keys(this.currentUrls).forEach(key => {
                if (this.currentUrls[key]) { try { URL.revokeObjectURL(this.currentUrls[key]); } catch (e) {} this.currentUrls[key] = null; }
            });
        };
        return 'cleanup patched: src never emptied';
    })()`));
}

// `hold`: the R74 fix injected into the installed page, so the measurement exists before the build.
// The shipped copy of these three methods lives in MultiCameraPlayer (script.js) and the wiring is in
// loadSegmentForAllCameras; the await loop below is the only difference — the probe can only hook the
// whole call, so the release is registered after the loads resolve rather than at `src =` time.
if (MODE.endsWith('hold')) {
    console.log(await evalIn(`(() => {
        const m = viewer.multiCameraPlayer;
        const W = 480, MAXMS = 7000;
        m.heldFrames = {};
        m.releaseHeldFrame = function (camera) {
            const held = this.heldFrames[camera];
            if (!held) return;
            if (held.timer) clearTimeout(held.timer);
            if (held.onData && held.player) held.player.removeEventListener('loadeddata', held.onData);
            if (held.onError && held.player) held.player.removeEventListener('error', held.onError);
            held.canvas.remove();
            delete this.heldFrames[camera];
        };
        m.holdFeedFrames = function (cameras) {
            const self = this;
            Object.keys(this.heldFrames).forEach(c => self.releaseHeldFrame(c));
            Array.from(cameras).forEach(camera => {
                const player = this.players[camera];
                const container = this.playerContainers[camera];
                if (!player || !container || !player.videoWidth || !player.videoHeight) return;
                const canvas = document.createElement('canvas');
                canvas.className = 'feed-hold';
                canvas.width = W;
                canvas.height = Math.max(1, Math.round(W * player.videoHeight / player.videoWidth));
                try { canvas.getContext('2d').drawImage(player, 0, 0, canvas.width, canvas.height); }
                catch (e) { return; }
                container.appendChild(canvas);
                this.heldFrames[camera] = { canvas: canvas };
            });
        };
        m.awaitHeldFrameRelease = function (camera, player) {
            const self = this;
            const held = this.heldFrames[camera];
            if (!held) return;
            held.player = player;
            const settle = function () {
                if (self.heldFrames[camera] !== held) return;
                self.releaseHeldFrame(camera);
            };
            // Chained, not armed at swap time: a frame callback requested while the element is
            // changing resources answers for the *previous* file's queued frame.
            held.onData = function () {
                if (self.heldFrames[camera] !== held) return;
                if (typeof player.requestVideoFrameCallback === 'function') player.requestVideoFrameCallback(settle);
                else settle();
            };
            player.addEventListener('loadeddata', held.onData, { once: true });
            held.onError = settle;
            player.addEventListener('error', settle, { once: true });
            held.timer = setTimeout(function check() {
                if (self.heldFrames[camera] !== held) return;
                if (player.readyState < 2 && player.networkState === 2 && !player.error) {
                    held.timer = setTimeout(check, MAXMS);
                    return;
                }
                self.releaseHeldFrame(camera);
            }, MAXMS);
        };
        const style = document.createElement('style');
        style.textContent = '.video-container .feed-hold{position:absolute;inset:0;width:100%;height:100%;'
            + 'object-fit:contain;pointer-events:none;z-index:25;transform-origin:center;'
            + 'transform:translate(var(--feed-pan-x, 0px), var(--feed-pan-y, 0px)) scale(var(--feed-zoom, 1))}';
        document.head.appendChild(style);
        const orig = m.loadSegmentForAllCameras.bind(m);
        m.loadSegmentForAllCameras = async function (segment) {
            const keep = new Set(this.visibleCameras());
            keep.add('front');
            this.holdFeedFrames(keep);
            const result = await orig(segment);
            const self = this;
            Array.from(keep).forEach(camera => {
                const player = self.players[camera];
                if (player && player.src) self.awaitHeldFrameRelease(camera, player);
            });
            return result;
        };
        return 'hold patched';
    })()`));
}

// `off`: the control. Same page, same build, but the shipped snapshot is never taken —
// `awaitHeldFrameRelease` then finds no hold and does nothing, which is the pre-R74 behaviour.
// Without this, a 0 ms reading could just mean the probe stopped seeing the seam at all.
if (MODE.endsWith('off')) {
    console.log(await evalIn(`(() => {
        const m = viewer.multiCameraPlayer;
        m.holdFeedFrames = function () {};
        return 'hold disabled: no snapshot will be taken';
    })()`));
}

const preExpr = ['(() => {', "  const p = document.querySelector('#front-player');",
    '  return JSON.stringify({ segs: viewer.currentEvent.segments.length,',
    '    idx: viewer.currentSegmentIndex, paused: p.paused, vw: p.videoWidth,',
    '    left: Math.round((p.duration - p.currentTime) * 10) / 10 });', '})()'].join('\n');
const pre = JSON.parse(String(await evalIn(preExpr)));
if (String(pre) === 'undefined') { console.error('pre-check failed'); process.exit(1); }
console.log('pre:', JSON.stringify(pre));
// A manual fire needs a playing feed with a next segment and plenty of it left, because ending a clip
// looks exactly like a stuck feed. The `auto-*` modes must not refuse: the seam they are chasing can
// already be in progress when the recorder is installed, and exiting at that moment throws away the
// only rows that show it. They report every no-frame window instead, labelled by whether the file
// behind the feed changed — that is what makes a splice window distinguishable from a stall.
if (!MODE.startsWith('auto') && (!pre || pre.segs < 2 || pre.vw === 0 || pre.paused)) {
    console.error('refusing: needs a playing feed with a next segment');
    process.exit(1);
}
if (!MODE.startsWith('auto') && pre.left < 2.5) {
    console.error(`refusing: only ${pre.left}s of this segment left`);
    process.exit(1);
}
if (MODE.startsWith('auto')) {
    console.log(pre && pre.vw !== 0 && !pre.paused ? `(auto: about ${pre.left}s until the natural splice)`
        : '(auto: mid-seam at install; watching this one and the next)');
}

const segBefore = await evalIn('String(viewer.multiCameraPlayer.currentSegmentIndex)');
if (MODE.startsWith('auto')) {
    console.log('waiting for the natural `ended` splice (no manual call)');
} else {
    console.log(await evalIn(`(() => { window.__r74.t0 = performance.now(); viewer.playNextSegment(); return 'spliced at recorder t=0'; })()`));
}
await new Promise(r => setTimeout(r, RUN_MS));
console.log(await evalIn('(() => { window.__r74.running = false; return "stopped"; })()'));
const segAfter = await evalIn('String(viewer.multiCameraPlayer.currentSegmentIndex)');
console.log(`segment index ${segBefore} -> ${segAfter}`);

const rows = JSON.parse(String(await evalIn('JSON.stringify(window.__r74.rows)')));
console.log(`\n${MODE}: dt alpha mean spread rs vw paused ct src   (${rows.length} frames)`);
// Only the moments where something changed — a flat run of 100 identical rows hides the seam. The
// first column is padded wider than any timestamp, or the dt swallows the alpha reading next to it.
let prev = null;
for (const r of rows) {
    const key = r.slice(1).join('|');
    if (key !== prev) console.log(r.map((x, i) => String(x).padEnd(i === 0 ? 9 : 7)).join(''));
    prev = key;
}

// A run in which the file behind the feed never changed measured nothing at all: 「0 windows」 would
// just be a paused clip. Count the splices first and call the run void if there were none.
let splices = 0;
for (let i = 1; i < rows.length; i++) if (rows[i][8] && rows[i][8] !== rows[i - 1][8]) splices++;
console.log(`\n${MODE}: ${splices} file change(s) observed`);
if (!splices) {
    console.error('VOID RUN: no splice happened, so a clean reading proves nothing. '
        + 'Restart playback so the front feed has a next segment to reach.');
    process.exit(1);
}

// Every stretch in which the tile had nothing to present. The headline number is the longest one that
// belongs to a splice (file changed underneath); a same-file window is a stall, not 「衔接处闪一下」.
const windows = [];
let open = null;
for (let i = 0; i < rows.length; i++) {
    const blank = rows[i][1] < 0.5;
    if (blank && open === null) open = i;
    if (!blank && open !== null) { windows.push([open, i - 1]); open = null; }
}
if (open !== null) windows.push([open, rows.length - 1]);
console.log(`\n${MODE}: ${windows.length} no-frame window(s) of ${rows.length} frames`);
let worst = 0;
for (const [a, b] of windows) {
    const len = rows[b][0] - rows[a][0];
    const kind = rows[a][8] !== rows[b][8] ? `spliced ${rows[a][8]} -> ${rows[b][8]}` : `same file ${rows[a][8]}`;
    const edge = (a === 0 ? ' started before the recorder' : '')
        + (b === rows.length - 1 ? ' STILL BLANK when the run ended' : '');
    console.log(`  ${rows[a][0]}->${rows[b][0]} = ${len} ms, ${b - a + 1} frames, ${kind}${edge}`);
    if (rows[a][8] !== rows[b][8] && len > worst) worst = len;
}
console.log(`\n${MODE}: longest splice no-frame window = ${worst.toFixed(0)} ms`);
ws.close();
