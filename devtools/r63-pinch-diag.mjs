// R63-4 diagnosis: the recogniser pairs two-finger taps on a 340ms window measured between the two
// LIFTS, and a CDP-dispatched pair costs a websocket round trip per event, so a "miss" in the probe
// is not the same as a miss on a real phone. This logs, inside the page, the actual timestamp of
// every pointerdown/pointerup on the picture plus the value of viewer.pinchTapAt right after each
// lift, so the measured inter-lift gap settles whether the window is too tight or the gate is wrong.
//
//   node devtools/r63-pinch-diag.mjs <cssX> <cssY> [halfSpanPx] [gapMs]
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

const [cx, cy] = process.argv.slice(2).map(Number);
const span = Number(process.argv[4] || 60);
const gap = Number(process.argv[5] || 140);
if (![cx, cy].every(Number.isFinite)) {
    console.error('usage: r63-pinch-diag.mjs <cssX> <cssY> [halfSpanPx] [gapMs]');
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
const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    return r?.result?.value;
};

await ev(`(() => {
    // One listener pair per page, but the timeline restarts every run — a logger that accumulates
    // across runs is how the previous round read the same lift twice.
    window.__t0 = Date.now();
    window.__pu = [];
    if (!window.__puArmed) {
        window.__puArmed = true;
        // Bubble phase on window, so the logger runs AFTER the recogniser's own handler on the
        // picture: captured on the way in it would report the previous pair's pinchTapAt.
        const log = (e) => window.__pu.push({
            ph: e.type, at: Date.now() - window.__t0, id: e.pointerId,
            x: Math.round(e.clientX), y: Math.round(e.clientY),
            after: e.type === 'pointerup'
                ? (viewer.pinchTapAt ? 'set+' + Math.round(viewer.pinchTapAt.at - window.__t0) : 'null')
                : undefined,
        });
        window.addEventListener('pointerdown', log);
        window.addEventListener('pointerup', log);
    }
    return window.__pu.length;
})()`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pts = () => [
    { x: cx, y: cy - span / 2, id: 1 },
    { x: cx, y: cy + span / 2, id: 2 },
];

// A negative gap means "fire all four events without awaiting any reply". The 340ms pairing window
// is measured between the two LIFTS, and each awaited CDP round trip over adb costs ~80ms, so an
// awaited pair is physically ~500ms apart no matter what the sleep says — which proves nothing about
// the gate. Firing blind puts the pairs back-to-back, the way two real fingers would land.
if (gap < 0) {
    ws.send(JSON.stringify({ id: ++id, method: 'Input.dispatchTouchEvent', params: { type: 'touchStart', touchPoints: pts() } }));
    ws.send(JSON.stringify({ id: ++id, method: 'Input.dispatchTouchEvent', params: { type: 'touchEnd', touchPoints: [] } }));
    await sleep(40);
    ws.send(JSON.stringify({ id: ++id, method: 'Input.dispatchTouchEvent', params: { type: 'touchStart', touchPoints: pts() } }));
    ws.send(JSON.stringify({ id: ++id, method: 'Input.dispatchTouchEvent', params: { type: 'touchEnd', touchPoints: [] } }));
    await sleep(400);
} else {
    for (let tap = 0; tap < 2; tap++) {
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts() });
        await sleep(60);
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        if (tap === 0) await sleep(gap);
    }
    await sleep(300);
}

const timeline = await ev(`JSON.stringify(window.__pu)`);
console.log('timeline:', timeline);
console.log('state:', await ev(`JSON.stringify({
    zoom: viewer.feedZoom.back,
    chip: document.getElementById('phoneFeedValue').textContent,
    pinchTapAt: viewer.pinchTapAt && (viewer.pinchTapAt.at - window.__t0),
    live: viewer.pictureFingers.size
})`));
ws.close();
