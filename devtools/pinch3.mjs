// Two-finger spread/pinch built from CDP `Input.dispatchTouchEvent`, which is the only way to put two
// pointers down at coordinates we choose. `Input.synthesizePinchGesture` picks its own start points:
// closing the fingers (scaleFactor < 1) begins them far apart, and on the phone picture — 175 CSS px
// tall in landscape — those land on the header and the control row, so the gesture never even reaches
// the recogniser. Pinching *back to 1x* therefore needs the hands here.
//
//   node devtools/pinch3.mjs 457 150 75 31   # fingers 75px apart converge to 31px (≈ zoom /2.4)
//   node devtools/pinch3.mjs 457 150 40 120  # and the reverse: spread
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

const [cx, cy, from, to] = process.argv.slice(2).map(Number);
if (![cx, cy, from, to].every(Number.isFinite)) {
    console.error('usage: pinch3.mjs <cssX> <cssY> <startHalfSpanPx> <endHalfSpanPx>');
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
const pair = (a, b) => [
    { x: cx, y: cy - a, id: 1 },
    { x: cx, y: cy + b, id: 2 },
];

const STEPS = 12;
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pair(from / 2, from / 2) });
for (let i = 1; i <= STEPS; i++) {
    const span = from + (to - from) * (i / STEPS);
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pair(span / 2, span / 2) });
    await sleep(16);
}
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(300);

const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
        zoom: [...document.querySelectorAll('.video-container')].map(c => c.style.getPropertyValue('--feed-zoom') || '1'),
        zoomed: [...document.querySelectorAll('.video-container')].map(c => c.classList.contains('feed-zoomed')),
        pan: document.querySelector('.video-container').style.getPropertyValue('--feed-pan-x'),
        fingers: viewer.pictureFingers.size
    })`,
    returnByValue: true,
});
console.log(res?.result?.value ?? JSON.stringify(res));
ws.close();
