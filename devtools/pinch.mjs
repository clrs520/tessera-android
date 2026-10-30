// Dispatch a genuine two-finger pinch (or spread) into the app's WebView through the DevTools
// input pipeline, so `setupPhoneFeedPinch()` sees real TouchEvents rather than a constructed one.
//
//   node devtools/pinch.mjs --center 200 300                 # spread out, zooms in
//   node devtools/pinch.mjs --center 200 300 --shrink        # pinch in, zooms back out
//   node devtools/pinch.mjs --center 200 300 --pan           # spread *and* drag the midpoint
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

const argv = process.argv.slice(2);
const opt = (name, dflt) => {
    const i = argv.indexOf('--' + name);
    // Must fall back to the default: `Number(undefined)` is NaN, and CDP rejects a NaN coordinate
    // with a deserialization error that points at the field rather than at the cause.
    return i >= 0 ? argv[i + 1] : dflt;
};
const flag = (name) => argv.includes('--' + name);

const cx = Number(argv[0]);
const cy = Number(argv[1]);
if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
    console.error('usage: pinch.mjs <cssX> <cssY> [--shrink] [--pan] [--dx n] [--dy n] [--gap n] [--spread n]');
    process.exit(2);
}
const startGap = Number(opt('gap', 34));
const endGap = flag('shrink') ? 12 : Number(opt('spread', 190));
const steps = Number(opt('steps', 14));
const withPan = flag('pan');
const panDx = Number(opt('dx', 40));
const panDy = Number(opt('dy', 30));

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

const lerp = (a, b, t) => a + (b - a) * t;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const points = (gap, ox, oy) => ([
    { x: cx - gap / 2 + ox, y: cy + oy, radiusX: 12, radiusY: 12, force: 1, id: 1 },
    { x: cx + gap / 2 + ox, y: cy + oy, radiusX: 12, radiusY: 12, force: 1, id: 2 },
]);

await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(startGap, 0, 0) });
for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: points(lerp(startGap, endGap, t), withPan ? lerp(0, panDx, t) : 0, withPan ? lerp(0, panDy, t) : 0),
    });
    await sleep(16);
}
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(Number(opt('settle', 250)));

const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
        zoom: [...document.querySelectorAll('.video-container')].map(c => c.style.getPropertyValue('--feed-zoom') || '1'),
        pan: [...document.querySelectorAll('.video-container')].map(c => [c.style.getPropertyValue('--feed-pan-x'), c.style.getPropertyValue('--feed-pan-y')]),
        zoomed: [...document.querySelectorAll('.video-container')].map(c => c.classList.contains('feed-zoomed')),
        docScale: document.documentElement.style.zoom || 'none',
        videoTransform: [...document.querySelectorAll('.video-container video')].map(v => getComputedStyle(v).transform),
    })`,
    returnByValue: true, awaitPromise: true,
});
// `send` resolves the CDP result envelope, so the value lives at res.result.value — not on the
// stringified envelope, which is what made this print null for a gesture that had worked.
console.log(res?.result?.value ?? JSON.stringify(res));

ws.close();
