// R63-5: hold a finger on the progress bar, read the controls' state while it is still down,
// then move it above the bar and read again. adb `input swipe` is one atomic command, so the
// intermediate state can only be sampled with CDP touch events.
//   node devtools/r63-scrub-steps.mjs <x> <y> <upX> <upY>
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const PORT = 9333;
const [x0, y0, x1, y1] = process.argv.slice(2).map(Number);
if ([x0, y0, x1, y1].some(v => !Number.isFinite(v))) {
    console.error('usage: r63-scrub-steps.mjs <x0> <y0> <x1> <y1>');
    process.exit(2);
}

const pid = execFileSync(ADB, ['shell', 'pidof', 'com.tdashcam.studio'], { encoding: 'utf8' }).trim();
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);
const page = (await fetch(`http://127.0.0.1:${PORT}/json`).then(r => r.json())).find(p => p.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('ws timeout')), 8000);
    ws.addEventListener('open', () => { clearTimeout(t); res(); });
});
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); }
});
const send = (method, params) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const state = async (label, shot) => {
    if (shot) {
        const png = await send('Page.captureScreenshot', { format: 'png' });
        if (png.data) {
            const { writeFileSync } = await import('node:fs');
            writeFileSync(shot, Buffer.from(png.data, 'base64'));
        }
    }
    const r = await send('Runtime.evaluate', {
        expression: `(() => {
            const c = viewer.videoControls;
            return { dragging: c.isDragging, fine: c.fineScrub, preview: c.timePreview.className,
                look: (() => { const s = getComputedStyle(c.timePreview);
                    return [s.backgroundColor, s.borderTopColor, s.fontFamily.split(',')[0], s.fontSize,
                        s.opacity, Math.round(c.timePreview.getBoundingClientRect().top)]; })(),
                bubble: c.timePreview.textContent.trim(), display: c.videoTimeDisplay.textContent,
                time: Math.round(c.continuousPlayer.getCurrentTime() * 100) / 100,
                log: (window.__sc || []).slice(-2) };
        })()`,
        returnByValue: true,
    });
    console.log(label + ': ' + JSON.stringify(r.result?.value ?? r.exceptionDetails?.exception?.description));
};

await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
await sleep(120);
await state('down-on-bar');
for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    await send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, id: 1 }],
    });
    await sleep(70);
    if (i === 3 || i === 6) {
        const shot = process.env.SHOT_AT === String(i) ? process.env.SHOT_PATH : undefined;
        await state(`move-${i}`, shot);
    }
}
await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await sleep(200);
await state('released');
ws.close();
