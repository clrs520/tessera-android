// R74: is the picture genuinely blank at a segment splice, and for how long?
// Uses the real boundary path (playNextSegment, which is what `ended` calls) and screenshots the
// middle of the front tile every ~110 ms. `--bare` monkeypatches cleanup() so the splice assigns a
// fresh src without the `src='' + removeAttribute + load` step, which is the hypothesis being tested.
//   node devtools/r74-seam.mjs blank 22
//   node devtools/r74-seam.mjs bare 22
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;
const MODE = process.argv[2] || 'blank';
const SHOTS = Number(process.argv[3] || 22);
const GAP = Number(process.argv[4] || 110);

const pid = execFileSync(ADB, ['shell', 'pidof', APP_ID], { encoding: 'utf8' }).trim();
if (!pid) { console.error('app is not running'); process.exit(1); }
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) })
    .then((r) => r.json());
const page = pages.find((p) => p.type === 'page');
if (!page) { console.error('no inspectable page'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('connect timed out')), 8000);
    ws.addEventListener('open', () => { clearTimeout(t); resolve(); });
    ws.addEventListener('error', () => { clearTimeout(t); reject(new Error('connect failed')); });
});

let nextId = 1;
const pending = new Map();
ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, (msg) => (msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)));
    const t = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000);
    ws.addEventListener('message', () => clearTimeout(t), { once: true });
    ws.send(JSON.stringify({ id, method, params }));
});
const evalIn = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) return 'EX ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
};

mkdirSync('devtools/r74-frames', { recursive: true });

// Preconditions: an event with a next segment, playing, and the transport clock nowhere near the end
// (a splice that lands at the end of the clip reads as six dead feeds and the whole run is void).
const pre = await evalIn(`(() => {
    const m = viewer.multiCameraPlayer, p = m.players.front;
    return JSON.stringify({ segs: viewer.currentEvent.segments.length, idx: viewer.currentSegmentIndex,
        paused: p.paused, rs: p.readyState, ct: +p.currentTime.toFixed(2), dur: +p.duration.toFixed(2), vw: p.videoWidth });
})()`);
console.log('pre:', pre);
const preObj = JSON.parse(String(pre));
if (String(pre).startsWith('EX') || preObj.segs < 2 || !preObj.vw || preObj.paused) {
    console.error('refusing: needs a loaded, playing event with a next segment');
    process.exit(1);
}

if (MODE === 'bare') {
    const patched = await evalIn(`(() => {
        const m = viewer.multiCameraPlayer;
        if (m.__r74Bare) return 'already patched';
        m.__r74Bare = true;
        m.cleanup = function () {
            this.pauseAll();
            this.suspendedFeeds.clear();
            Object.keys(this.currentUrls).forEach(key => {
                if (this.currentUrls[key]) { try { URL.revokeObjectURL(this.currentUrls[key]); } catch (e) {} this.currentUrls[key] = null; }
            });
        };
        return 'patched: cleanup no longer blanks src';
    })()`);
    console.log('patch:', patched);
} else {
    console.log('patch: (none — stock cleanup)');
}

const box = JSON.parse(String(await evalIn(`(() => {
    const c = document.querySelector('#front-player').closest('.video-container');
    const r = c.getBoundingClientRect();
    return JSON.stringify({ x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) });
})()`)));
console.log(`mode=${MODE} tile ${box.w}x${box.h} centre ${box.x},${box.y}`);

const fired = MODE === 'steady'
    ? Number(String(await evalIn('performance.now().toFixed(0)')))
    : Number(await evalIn(`(() => { const t = performance.now(); viewer.playNextSegment(); return t.toFixed(0); })()`));
console.log(MODE === 'steady' ? 'baseline, no splice' : 'fired at page t =', MODE === 'steady' ? '' : fired, 'ms');

const lines = [];
for (let i = 0; i < SHOTS; i++) {
    const stamp = String(await evalIn(`(() => { const p=document.querySelector('#front-player');
        return [ (performance.now()-${fired}).toFixed(0), p.readyState, p.videoWidth, p.paused?1:0, p.currentTime.toFixed(2), viewer.isTransitioning?1:0 ].join(' '); })()`));
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 95, clip: { x: box.x - 10, y: box.y - 10, width: 20, height: 20, scale: 1 } });
    const file = `devtools/r74-frames/${MODE}-${String(i).padStart(2, '0')}.jpg`;
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
    lines.push(`${String(i).padStart(2)} dt/rs/vw/paused/ct/trans = ${stamp}`);
    await new Promise((r) => setTimeout(r, GAP));
}
console.log(lines.join('\n'));
ws.close();
