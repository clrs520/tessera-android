// List the DOM event listeners actually attached to an element, the way DevTools does.
//   node devtools/listeners.mjs [selector]
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const PORT = 9333;
const selector = process.argv[2] || '.progress-container';

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

await send('Runtime.enable');
const { result } = await send('Runtime.evaluate', {
    expression: `document.querySelector(${JSON.stringify(selector)})`,
    returnByValue: false,
});
if (!result?.objectId) { console.log('no element for', selector, JSON.stringify(result)); process.exit(1); }
const { listeners } = await send('DOMDebugger.getEventListeners', { objectId: result.objectId, depth: 0 });
console.log(JSON.stringify(listeners, null, 1).slice(0, 4000));
ws.close();
