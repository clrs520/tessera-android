// Evaluate a JS expression inside the running Android app's WebView via Chrome DevTools
// Protocol, and print the JSON result. Lets a release APK be inspected without screenshots.
//
//   node devtools/cdp-eval.mjs 'JSON.stringify(getComputedStyle(document.querySelector("#front-player")).objectFit)'
//   node devtools/cdp-eval.mjs --file devtools/probe.js
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const SERIAL = (process.env.ADB_SERIAL || '').trim();
const PORT = Number(process.env.CDP_PORT || 9333);
const adb = (args) => execFileSync(ADB, SERIAL ? ['-s', SERIAL, ...args] : args, { encoding: 'utf8' });

const args = process.argv.slice(2);
const expression = args[0] === '--file'
    ? readFileSync(args[1], 'utf8')
    : args.join(' ');
if (!expression.trim()) {
    console.error('usage: cdp-eval.js <expression> | --file <path>');
    process.exit(2);
}

// `pidof` intermittently returns empty on this emulator while the process is alive, and
// listing every pid costs a second round trip, so fall back to ps before giving up.
let pid = process.env.CDP_PID?.trim() || '';
if (!pid) {
    try {
        pid = adb(['shell', 'pidof', APP_ID]).trim();
    } catch (e) {
        pid = '';
    }
}
if (!pid) {
    const ps = adb(['shell', 'ps', '-A']);
    pid = (ps.split(/\r?\n/).find((line) => line.trim().endsWith(APP_ID)) || '')
        .split(/\s+/)[1] || '';
}
if (!pid) {
    console.error('app is not running');
    process.exit(1);
}
execFileSync(ADB, SERIAL ? ['-s', SERIAL, 'forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`] : ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) })
    .then((r) => r.json());
const page = pages.find((p) => p.type === 'page');
if (!page) {
    console.error('no inspectable page');
    process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('websocket connect timed out')), 8000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
    ws.addEventListener('error', (e) => { clearTimeout(timer); reject(new Error('websocket connect failed: ' + (e.message || e.error))); });
});

const response = new Promise((resolve, reject) => {
    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id !== 1) return;
        if (msg.error) return reject(new Error(JSON.stringify(msg.error)));
        const result = msg.result;
        if (result.exceptionDetails) {
            return reject(new Error(result.exceptionDetails.exception?.description || 'threw'));
        }
        resolve(result.result.value);
    });
});

ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression, returnByValue: true, awaitPromise: true },
}));

// The WebView can be busy (long task, paused debugger); never let this hang a build loop.
const timeout = setTimeout(() => {
    console.error('timed out waiting for the WebView to answer');
    process.exit(1);
}, Number(process.env.CDP_TIMEOUT_MS || 10000));

const value = await response;
clearTimeout(timeout);
console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
ws.close();
