// Boot-trace helper: installs an observer at document-start, reloads the app, and reports the
// timeline of a set of class attributes. Used to catch a panel that paints in one state and is
// moved out of it a frame later (the "list flashes open then vanishes" class of bug).
//
//   node devtools/cdp-boottrace.mjs '#sidebar,body' 
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9333;
const WATCH = (process.argv[2] || '.sidebar,body').split(',');
const WAIT_MS = Number(process.argv[3] || 9000);

let pid = process.env.CDP_PID?.trim() || '';
if (!pid) {
    try { pid = execFileSync(ADB, ['shell', 'pidof', APP_ID], { encoding: 'utf8' }).trim(); } catch { pid = ''; }
}
if (!pid) {
    const ps = execFileSync(ADB, ['shell', 'ps', '-A'], { encoding: 'utf8' });
    pid = (ps.split(/\r?\n/).find((l) => l.trim().endsWith(APP_ID)) || '').split(/\s+/)[1] || '';
}
if (!pid) { console.error('app is not running'); process.exit(1); }
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then((r) => r.json());
const page = pages.find((p) => p.type === 'page');
if (!page) { console.error('no inspectable page'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('ws timeout')), 8000);
    ws.addEventListener('open', () => { clearTimeout(t); res(); });
    ws.addEventListener('error', () => rej(new Error('ws failed')));
});

let seq = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
});
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (!m.id) return;
    const p = pending.get(m.id);
    pending.delete(m.id);
    if (!p) return;
    if (m.error) p.rej(new Error(JSON.stringify(m.error))); else p.res(m.result);
});

await send('Runtime.enable');
await send('Page.enable');

const seed = `(() => {
    const WATCH = ${JSON.stringify(WATCH)};
    const t0 = performance.now();
    const log = [];
    const seen = new Map();
    function snap(tag) {
        for (const sel of WATCH) {
            const el = sel === 'body' ? document.body : document.querySelector(sel);
            if (!el) continue;
            const cls = el.className || '';
            const r = el.getBoundingClientRect();
            const key = sel;
            if (seen.get(key) === cls) continue;
            seen.set(key, cls);
            log.push({ sel, at: Math.round(performance.now() - t0), phase: tag, cls,
                       x: Math.round(r.x), w: Math.round(r.width),
                       hidden: getComputedStyle(el).visibility, disp: getComputedStyle(el).display });
        }
    }
    // A class that is already right at DOMContentLoaded still says nothing: the drawer can be
    // *mid-transition* then, which is exactly what a flash looks like. So sample the geometry per
    // frame as well and log every move of the watched element's x.
    const posSeen = new Map();
    function frame() {
        for (const sel of WATCH) {
            const el = sel === 'body' ? document.body : document.querySelector(sel);
            if (!el) continue;
            const r = el.getBoundingClientRect();
            const k = Math.round(r.x) + '/' + (el.className || '');
            if (posSeen.get(sel) === k) continue;
            posSeen.set(sel, k);
            log.push({ sel, at: Math.round(performance.now() - t0), phase: 'raf', cls: el.className || '',
                       x: Math.round(r.x), w: Math.round(r.width),
                       hidden: getComputedStyle(el).visibility, disp: getComputedStyle(el).display });
        }
        if (performance.now() - t0 < 4000) requestAnimationFrame(frame);
    }
    const mo = new MutationObserver(() => snap('mut'));
    function start() {
        log.push({ sel: '(doc)', at: Math.round(performance.now() - t0), phase: 'seed',
                   cls: 'readyState=' + document.readyState, x: 0, w: 0, hidden: '', disp: '' });
        snap('boot');
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'], subtree: true });
        requestAnimationFrame(frame);
    }
    if (document.documentElement) start();
    else document.addEventListener('readystatechange', start, { once: true });
    addEventListener('DOMContentLoaded', () => snap('dcl'));
    addEventListener('load', () => snap('load'));
    setTimeout(() => snap('t2000'), 2000);
    setTimeout(() => snap('t6000'), 6000);
    window.__bootLog = () => ({ now: Math.round(performance.now()), log });
})()`;

await send('Page.addScriptToEvaluateOnNewDocument', { source: seed });
await send('Page.reload', { ignoreCache: false });

await new Promise((r) => setTimeout(r, WAIT_MS));

// Re-resolve the page target: a reload can hand back a fresh ws url.
const res = await send('Runtime.evaluate', {
    expression: 'window.__bootLog ? JSON.stringify(window.__bootLog()) : "MISSING"',
    returnByValue: true,
});
const out = res.result?.value;
if (!out || out === 'MISSING') {
    console.error('boot log missing — the injected script did not survive the reload');
    process.exit(1);
}
const parsed = JSON.parse(out);
console.log(`t=now ${parsed.now}ms`);
for (const e of parsed.log) {
    console.log(`${String(e.at).padStart(6)}ms ${e.phase.padEnd(6)} ${e.sel.padEnd(12)} x=${String(e.x).padStart(5)} w=${String(e.w).padStart(4)} vis=${e.hidden.padEnd(8)} ${e.cls}`);
}
ws.close();
process.exit(0);
