// R89: pinch-to-zoom then *drag* — the pan path has only ever been tested by writing
// `peZoomView.x` and calling the clamp, which proves the clamp and not the gesture.
// Two pointers go down through CDP `Input.dispatchTouchEvent` (the only way to choose coordinates),
// spread to zoom, lift, then a single finger drags. Every pointer event the stage sees is counted,
// because a `pointercancel` arriving mid-drag is the usual reason a pan silently does nothing.
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

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
const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) {
        return `EXCEPTION ${r.exceptionDetails.exception?.description
            || r.exceptionDetails.text || JSON.stringify(r.exceptionDetails).slice(0, 300)}`;
    }
    return r?.result?.value;
};

// ---- put the zoom layer on screen with a two-view plan, and instrument the stage
const setup = await ev(`(async () => {
    const v = viewer, sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const ev2 = (v.eventGroups || []).find(e => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    if (!ev2) return JSON.stringify({ fatal: 'no SEI fixture' });
    if (!v.currentEvent || v.currentEvent.eventId !== ev2.eventId) { await v.playEvent(ev2.eventId); await sleep(2500); }
    v.peSelection.size = '720';
    v.peSelection.cameras = ['front', 'back'];
    v.showPhoneExportModal();
    await sleep(500);
    v.closePhoneExportZoom();
    if (!v.pePreviewOn) v.togglePhoneExportPreview();
    for (let i = 0; i < 80 && /正在取帧|Fetching/.test(v.peDom.previewCap.textContent || ''); i += 1) await sleep(500);
    v.openPhoneExportZoom();
    await sleep(1200);
    const stage = v.peDom.zoomStage;
    window.__zlog = [];
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'])
        stage.addEventListener(t, (e) => window.__zlog.push(t + ':' + e.pointerId), true);
    // Record what the pan branch actually sees: a NaN written into peZoomView.x makes the whole
    // transform assignment invalid, and the browser silently keeps the previous string.
    window.__zpan = [];
    const origMove = v.onPeZoomPointerMove.bind(v);
    v.onPeZoomPointerMove = function (e) {
        const g = v.peZoomGesture;
        // Only the pan phase: one pointer down, a live gesture, and the picture already zoomed.
        if (window.__zpan.length < 6 && v.peZoomView.scale > 1.001 && g && v.peZoomPointers.size === 1) {
            window.__zpan.push({ clientX: e.clientX, clientY: e.clientY,
                x0: g.x0, y0: g.y0, panX0: g.panX0, panY0: g.panY0,
                x: String(v.peZoomView.x), y: String(v.peZoomView.y),
                cw: v.peDom.zoomCanvas.clientWidth, ch: v.peDom.zoomCanvas.clientHeight });
        }
        return origMove(e);
    };
    window.__zbind = (window.__zbind || 0) + 1;
    const b = stage.getBoundingClientRect();
    return JSON.stringify({ shown: document.getElementById('peZoomModal').classList.contains('show'),
        stage: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
        touchAction: getComputedStyle(stage).touchAction,
        canvasTouchAction: getComputedStyle(v.peDom.zoomCanvas).touchAction,
        scale: v.peZoomView.scale,
        frameWidths: [...document.querySelectorAll('#peZoomModal img')].map(i => i.naturalWidth),
        fetchW: typeof PHONE_EXPORT_FRAME_W === 'number' ? PHONE_EXPORT_FRAME_W : 'n/a' });
})()`);
console.log('setup:', setup);
const S = JSON.parse(setup);
if (S.fatal) process.exit(1);
const [, , sw, sh] = S.stage;
const cx = S.stage[0] + sw / 2, cy = S.stage[1] + sh / 2;

// ---- 1. spread two fingers: 60px half-span out to 200px
const pair = (half) => [{ x: cx, y: cy - half, id: 1 }, { x: cx, y: cy + half, id: 2 }];
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pair(30) });
for (let i = 1; i <= 14; i += 1) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pair(30 + (100 - 30) * i / 14) });
    await sleep(16);
}
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(400);
console.log('after pinch:', await ev(`JSON.stringify({scale:viewer.peZoomView.scale,
    x:Math.round(viewer.peZoomView.x), y:Math.round(viewer.peZoomView.y),
    transform:viewer.peDom.zoomCanvas.style.transform,
    pinch:!!viewer.peZoomPinch, pointers:viewer.peZoomPointers.size,
    gesture:viewer.peZoomGesture ? 'left' : null})`));

// ---- 2. now drag with ONE finger, 140px to the left and 60px up
const one = (x, y) => [{ x, y, id: 7 }];
await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: one(cx, cy) });
for (let i = 1; i <= 14; i += 1) {
    await send('Input.dispatchTouchEvent', { type: 'touchMove',
        touchPoints: one(cx - 10 * i, cy - 4 * i) });
    await sleep(16);
}
const mid = await ev(`JSON.stringify({scale:viewer.peZoomView.scale,
    x:Math.round(viewer.peZoomView.x), y:Math.round(viewer.peZoomView.y),
    transform:viewer.peDom.zoomCanvas.style.transform, pointers:viewer.peZoomPointers.size,
    gesture:viewer.peZoomGesture ? 'live' : null})`);
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(400);
const after = await ev(`JSON.stringify({scale:viewer.peZoomView.scale,
    x:Math.round(viewer.peZoomView.x), y:Math.round(viewer.peZoomView.y),
    transform:viewer.peDom.zoomCanvas.style.transform,
    zoomStillOpen:document.getElementById('peZoomModal').classList.contains('show'),
    pageStillOpen:document.getElementById('phoneExportModal').classList.contains('show')})`);
const log = await ev(`(() => { const c = {}; for (const t of window.__zlog) c[t.split(':')[0]] = (c[t.split(':')[0]]||0)+1;
    return JSON.stringify({ counts: c, first: window.__zlog.slice(0, 4), last: window.__zlog.slice(-4),
        total: window.__zlog.length }); })()`);
console.log('mid drag:', mid);
console.log('after drag:', after);
console.log('stage events:', log);
console.log('pan branch:', await ev('JSON.stringify(window.__zpan)'));

// ---- verdict, so a run that merely printed numbers cannot be read as a pass
const m = JSON.parse(mid), a = JSON.parse(after), c = JSON.parse(log);
const movedX = Number(m.x), movedY = Number(m.y);
const line = (name, pass, detail) => console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`);
console.log('--- verdict');
line('拖动确实写进了 x/y（不再是 NaN）', Number.isFinite(movedX) && Number.isFinite(movedY)
    && movedX < -40 && movedY < -10, `x=${m.x} y=${m.y}，拖了 -140/-56`);
line('transform 跟着动了，没被浏览器判非法丢掉',
    /translate3d\(-?\d/.test(a.transform) && !/^translate3d\(0px/.test(a.transform), a.transform);
line('一个指针只有一次 pointerdown（没重复绑定）', c.counts.pointerdown === 3,
    JSON.stringify(c.counts));
line('拖完抬手没有被当成点按弹回 1×', a.scale > 2, `scale=${a.scale}`);
line('放大层和页面都还开着', a.zoomStillOpen && a.pageStillOpen);
ws.close();
