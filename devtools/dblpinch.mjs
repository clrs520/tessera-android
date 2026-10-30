// R63-4: two fingers, twice, without moving — the two-finger double-tap that resets a blown-up feed
// to 1x. Built the same way as pinch3.mjs (CDP Input.dispatchTouchEvent) because adb `input` can only
// put one finger down. No touchMove at all: the recogniser tells this gesture from a pinch by the
// fingers not having travelled.
//
//   node devtools/dblpinch.mjs <cssX> <cssY> [halfSpanPx] [gapMs]
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

const [cx, cy] = process.argv.slice(2).map(Number);
const span = Number(process.argv[4] || 60);
const gap = Number(process.argv[5] || 140);
if (![cx, cy].every(Number.isFinite)) {
    console.error('usage: dblpinch.mjs <cssX> <cssY> [halfSpanPx] [gapMs]');
    process.exit(2);
}

const pid = execFileSync(ADB, ['shell', 'pidof', APP_ID], { encoding: 'utf8' }).trim();
if (!pid) { console.error('app is not running'); process.exit(1); }
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) })
    .then((r) => r.json());
const page = pages.find((p) => p.type === 'page');
if (!page) { console.error('no inspectable page'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('websocket connect timed out')), 8000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('websocket connect failed')); });
});

let id = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
});
const send = (method, params) => new Promise((resolve, reject) => {
    const next = ++id;
    pending.set(next, { resolve, reject });
    ws.send(JSON.stringify({ id: next, method, params }));
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pair = () => [
    { x: cx, y: cy - span / 2, id: 1 },
    { x: cx, y: cy + span / 2, id: 2 },
];

for (let tap = 0; tap < 2; tap++) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pair() });
    await sleep(60);
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    if (tap === 0) await sleep(gap);
}
await sleep(250);

const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
        zoom: [...document.querySelectorAll('.video-container')].map(c => c.style.getPropertyValue('--feed-zoom') || '1'),
        zoomed: [...document.querySelectorAll('.video-container')].filter(c => c.classList.contains('feed-zoomed')).map(c => c.dataset.camera),
        chip: document.getElementById('phoneFeedHint').className + ' / ' + document.getElementById('phoneFeedValue').textContent,
        pinchTapAt: viewer.pinchTapAt,
        fingers: viewer.pictureFingers.size
    })`,
    returnByValue: true,
});
console.log(res?.result?.value ?? JSON.stringify(res));
ws.close();
