// Synthesize a real pinch through CDP's own gesture generator (`Input.synthesizePinchGesture`), which
// emits the touch sequence the way the compositor does — hand-rolled two-point touchStarts arrive as
// a single touch on this WebView and the app never sees two fingers.
//
//   node devtools/pinch2.mjs 206 420 2      # spread: picture doubles
//   node devtools/pinch2.mjs 206 420 0.5    # pinch: back down
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

const [cx, cy, factor] = process.argv.slice(2).map(Number);
if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
    console.error('usage: pinch2.mjs <cssX> <cssY> [scaleFactor]');
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

await send('Input.synthesizePinchGesture', {
    x: cx, y: cy, scaleFactor: Number.isFinite(factor) ? factor : 2,
    relativeSpeed: 400, gestureSourceType: 'touch',
});
await new Promise((r) => setTimeout(r, 400));

const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
        zoom: [...document.querySelectorAll('.video-container')].map(c => c.style.getPropertyValue('--feed-zoom') || '1'),
        zoomed: [...document.querySelectorAll('.video-container')].map(c => c.classList.contains('feed-zoomed')),
        docZoom: document.documentElement.style.zoom || 'none',
        starts: (window.__pinchLog || []).length
    })`,
    returnByValue: true,
});
console.log(res?.result?.value ?? JSON.stringify(res));
ws.close();
