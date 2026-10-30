// R63-5 diagnostic: wrap the scrub entry points so a real finger swipe tells us which one ran,
// and log the raw pointer stream that the progress container sees.
//   node devtools/r63-scrub-hook.mjs arm    -> install the wrappers
//   node devtools/r63-scrub-hook.mjs read   -> dump the log
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const PORT = 9333;
const cmd = process.argv[2] || 'read';

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
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async expression => {
    const r = await send('Runtime.evaluate', { expression: `(()=>{${expression}})()`, returnByValue: true });
    const ex = r.result?.exceptionDetails;
    if (ex) return 'EX ' + (ex.exception?.description || ex.text);
    return JSON.stringify(r.result?.result?.value ?? null);
};

if (cmd === 'arm') {
    console.log(await ev(`
        const c = viewer.videoControls;
        window.__sc = [];
        const log = (what, e) => __sc.push([what, Math.round(e.clientX), Math.round(e.clientY),
            e.pointerType, e.target.className || e.target.tagName, viewer.videoControls.isDragging ? 1 : 0,
            c.fineScrub ? 1 : 0].join('|'));
        const bar = c.progressContainer.getBoundingClientRect();
        ['pointerdown', 'pointermove', 'pointerup'].forEach(t =>
            c.progressContainer.addEventListener(t, e => log('cap-' + t, e), true));
        c.progressContainer.addEventListener('pointerdown', e => log('listener-down', e));
        ['pointerdown', 'pointermove', 'pointerup'].forEach(t =>
            document.addEventListener(t, e => { if (e.clientY > bar.top - 40) log('doc-' + t, e); }, true));
        const o = { start: c.startDrag.bind(c), drag: c.onDrag.bind(c), stop: c.stopDrag.bind(c) };
        c.startDrag = e => { log('START', e); return o.start(e); };
        c.onDrag = e => { log('DRAG', e); return o.drag(e); };
        c.stopDrag = e => { log('STOP', e); return o.stop(e); };
        c.continuousPlayer.seekToTime(0);
        return { armed: true, bar: [Math.round(bar.left), Math.round(bar.top), Math.round(bar.width), Math.round(bar.height)],
            markerAt: (document.elementFromPoint(200, 780) || {}).className };`));
} else {
    console.log(await ev(`
        const c = viewer.videoControls;
        return { n: __sc.length, first: __sc.slice(0, 3), last: __sc.slice(-3),
            fine: c.fineScrub, preview: c.timePreview.className,
            time: Math.round(c.continuousPlayer.getCurrentTime() * 100) / 100 };`));
}
ws.close();
