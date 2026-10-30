// R63-5 diagnostic: watch a real finger scrub on the progress bar and report where fine mode
// engaged, so the 1/8 ratio can be checked against the raw travel rather than trusted.
//   node devtools/r63-scrub-log.mjs <start|read|clear>
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const PORT = 9333;
const cmd = process.argv[2] || 'start';

const pid = execFileSync(ADB, ['shell', 'pidof', 'com.tdashcam.studio'], { encoding: 'utf8' }).trim();
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);
const page = (await fetch(`http://127.0.0.1:${PORT}/json`).then(r => r.json()))
    .find(p => p.type === 'page');

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('ws timeout')), 8000);
    ws.addEventListener('open', () => { clearTimeout(t); res(); });
});
let id = 0; const pending = new Map();
ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); p(m); }
});
const send = (method, params) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async expression => {
    const r = await send('Runtime.evaluate', { expression: `(()=>{${expression}})()`, returnByValue: true });
    if (r.result?.exceptionDetails) return 'EX ' + r.result.exceptionDetails.exception?.description;
    return r.result?.result?.value;
};

if (cmd === 'start' || cmd === 'clear') {
    console.log(await ev(`
        const c = viewer.videoControls;
        if (!window.__sb) {
            window.__sb = [];
            c.progressContainer.addEventListener('pointermove', e => {
                const rect = c.progressContainer.getBoundingClientRect();
                __sb.push([Math.round(e.clientX), Math.round(e.clientY),
                    e.pointerType, c.fineScrub ? 1 : 0, Math.round(rect.top)]);
            }, true);
        }
        __sb.length = 0;
        c.fineScrub = null;
        c.timePreview.classList.remove('fine');
        c.continuousPlayer.seekToTime(0);
        return JSON.stringify({ armed: true,
            bar: ['x', 'y', 'w', 'h'].map((k, i) =>
                Math.round(c.progressContainer.getBoundingClientRect()[['left', 'top', 'width', 'height'][i]])),
            total: Math.round(c.totalDuration * 100) / 100 });`));
} else {
    console.log(await ev(`
        const c = viewer.videoControls;
        return JSON.stringify({
            samples: __sb.slice(0, 4).concat(__sb.slice(-2)),
            count: __sb.length,
            fineScrub: c.fineScrub,
            previewClass: c.timePreview.className,
            previewText: c.timePreview.textContent.trim(),
            time: Math.round(c.continuousPlayer.getCurrentTime() * 1000) / 1000,
            total: c.totalDuration,
            display: c.videoTimeDisplay.textContent
        });`));
}
ws.close();
