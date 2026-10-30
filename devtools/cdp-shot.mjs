// Screenshot the app's WebView through CDP. `adb screencap` on the emulator returns an
// all-white frame once a SurfaceView is composited; Page.captureScreenshot reads the
// WebView's own layer and keeps the DOM visible.
//   node devtools/cdp-shot.mjs out.png
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;
const out = process.argv[2] || 'devtools/.tmp-cdp-shot.png';

const pid = execFileSync(ADB, ['shell', 'pidof', APP_ID], { encoding: 'utf8' }).trim();
if (!pid) { console.error('app is not running'); process.exit(1); }
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) })
    .then((r) => r.json());
const page = pages.find((p) => p.type === 'page');
if (!page) { console.error('no inspectable page'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('connect timed out')), 8000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('connect failed')); });
});

const shot = new Promise((resolve, reject) => {
    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id !== 1) return;
        if (msg.error) return reject(new Error(JSON.stringify(msg.error)));
        resolve(msg.result.data);
    });
});
ws.send(JSON.stringify({ id: 1, method: 'Page.captureScreenshot', params: { format: 'png' } }));
const timer = setTimeout(() => { console.error('timed out'); process.exit(1); }, 15000);
writeFileSync(out, Buffer.from(await shot, 'base64'));
clearTimeout(timer);
console.log(out);
ws.close();
