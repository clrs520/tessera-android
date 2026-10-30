// Push a CSS snippet into the running app's WebView so a layout change can be measured
// before spending a full release build on it.
//
//   node devtools/patch-css.mjs src/styles.css 3500 3660
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;

const [file, fromLine, toLine] = process.argv.slice(2);
if (!file) {
    console.error('usage: patch-css.mjs <css-file> [fromLine] [toLine]');
    process.exit(2);
}
const lines = readFileSync(file, 'utf8').split('\n');
const css = lines.slice((+fromLine || 1) - 1, toLine ? +toLine : undefined).join('\n');

const expression = `(() => {
    let s = document.getElementById('live-patch');
    if (!s) { s = document.createElement('style'); s.id = 'live-patch'; document.head.appendChild(s); }
    s.textContent = ${JSON.stringify(css)};
    return 'patched ' + s.textContent.length + ' bytes';
})()`;

const pid = execFileSync(ADB, ['shell', 'pidof', APP_ID], { encoding: 'utf8' }).trim();
if (!pid) { console.error('app is not running'); process.exit(1); }
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then((r) => r.json());
const page = pages.find((p) => p.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
});
const response = new Promise((resolve, reject) => {
    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id !== 1) return;
        if (msg.error) return reject(new Error(JSON.stringify(msg.error)));
        resolve(msg.result.result.value);
    });
});
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
console.log(await response);
ws.close();
