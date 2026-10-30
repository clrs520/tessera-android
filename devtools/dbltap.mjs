// R64-2 zone acceptance done properly: two real touch events per pair, timed inside the 340 ms
// pairing window. adb `input tap` spawns a process per tap, so the two pointerups land 360-430 ms
// apart and the recogniser legitimately refuses to pair them — the gesture then looks dead.
// CDP Input.dispatchTouchEvent goes through the same trusted input pipeline but with exact timing.
//
// ⚠ The CDP round trip itself is ~150ms, so the two lifts land roughly `2 * latency + pairMs` apart:
// pairMs 60 measures 190-270ms, pairMs 120 measured 732ms on the first pair (cold websocket) and
// 270ms after that. Read the lifts back (`pointerup` timeStamp) before believing a burst was timed.
//
//   node devtools/dbltap.mjs <cssX> <cssY> [pairs] [gapMs] [pairMs]
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

const [cx, cy, n = 1, gap = 900, pairMs = 60] = process.argv.slice(2).map(Number);
if (![cx, cy].every(Number.isFinite)) {
    console.error('usage: dbltap.mjs <cssX> <cssY> [pairs] [gapMs] [pairMs]');
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
const point = [{ x: cx, y: cy, id: 1 }];

// Fire-and-forget: awaiting each reply puts ~150ms of pipe latency between the lift and the next
// press, so a cold pair measured 732ms apart and the recogniser (correctly) refused to pair it.
// The messages queue in order over one socket and land tens of ms apart, which is what a double tap
// is. `pairMs` is only the extra spacing after that, and `gap` still separates the pairs.
const post = (method, params) => ws.send(JSON.stringify({ id: ++id, method, params }));

for (let i = 0; i < n; i++) {
    post('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point });
    post('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    if (pairMs) await sleep(pairMs);
    post('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point });
    post('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    if (i < n - 1) await sleep(gap);
}
await sleep(400);
const span = await send('Runtime.evaluate', {
    expression: `JSON.stringify((window.__lifts || []).slice(-2 * ${n}))`, returnByValue: true,
}).catch(() => ({ result: { value: 'no lift probe armed' } }));
console.log(`--- ${n} double taps at css(${cx},${cy}), pair ${pairMs}ms, gap ${gap}ms, lifts ${span?.result?.value || '?'} ---`);
ws.close();
