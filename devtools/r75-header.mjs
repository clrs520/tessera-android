// R75: does the desktop header icon row actually *paint* on a cold start?
//
// `adb screencap` is too slow to catch a one-frame flash (ten parallel captures of a boot returned ten
// byte-identical images), and a CDP screenshot is taken on demand — both miss a frame that is already
// gone. So the instrument is a rAF sampler installed with `Page.addScriptToEvaluateOnNewDocument`,
// which runs *before any of the page's own scripts*: every animation frame of the boot gets the
// computed appearance of `#headerActionsGroup`. A frame whose row is laid out and visible is a frame
// the user could see, which is the thing being asked — not whether some class exists at the end.
//
//   node devtools/r75-header.mjs          (reload and report the boot timeline)
//   node devtools/r75-header.mjs cold     (force-stop + start first, then attach and read the boot
//                                          that just happened — the sampler misses the earliest frames,
//                                          so prefer the reload mode for the headline number)
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP_ID = 'com.tdashcam.studio';
const PORT = 9334;
const MODE = process.argv[2] || 'reload';

const pid = execFileSync(ADB, ['shell', 'pidof', APP_ID], { encoding: 'utf8' }).trim();
if (!pid) { console.error('app is not running'); process.exit(1); }
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);
const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) }).then(r => r.json());
const page = pages.find(p => p.type === 'page');
if (!page) { console.error('no inspectable page'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('connect timed out')), 8000);
    ws.addEventListener('open', () => { clearTimeout(t); res(); });
    ws.addEventListener('error', () => { clearTimeout(t); rej(new Error('connect failed')); });
});
let nextId = 1; const pending = new Map();
ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => { pending.delete(id); rej(new Error(`${method} timed out`)); }, 20000);
    ws.send(JSON.stringify({ id, method, params }));
});
const evalIn = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.exceptionDetails) return 'EX ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
};

// Every frame: is the header action row standing where a user could see it?
const sampler = `(() => {
    if (window.__r75) window.__r75.running = false;
    const me = window.__r75 = { rows: [], running: true };
    const tick = () => {
        if (!me.running || window.__r75 !== me) return;
        const el = document.getElementById('headerActionsGroup');
        const header = document.querySelector('.main-header');
        if (el && header) {
            const cs = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            me.rows.push({
                t: Math.round(performance.now()),
                ready: document.readyState,
                disp: cs.display, vis: cs.visibility, opa: cs.opacity,
                collapsed: header.classList.contains('header-collapsed'),
                boot: document.documentElement.classList.contains('phone-boot'),
                touchUi: document.documentElement.classList.contains('touch-ui'),
                w: Math.round(r.width), h: Math.round(r.height),
                top: Math.round(r.top), left: Math.round(r.left),
                kids: el.querySelectorAll('button').length
            });
        }
        if (performance.now() < 5000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
})()`;

if (MODE === 'cold') {
    execFileSync(ADB, ['shell', 'am', 'force-stop', APP_ID]);
    execFileSync(ADB, ['shell', 'am', 'start', '-n', `${APP_ID}/.MainActivity`]);
    await new Promise(r => setTimeout(r, 1500));
    console.log(await evalIn(sampler));
    console.log('(cold: the sampler attached after the first frames, so this mode only shows the tail)');
} else {
    await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: sampler });
    await send('Page.reload', { ignoreCache: false });
}

await new Promise(r => setTimeout(r, MODE === 'cold' ? 6000 : 9000));
console.log(await evalIn('(() => { window.__r75.running = false; return "stopped"; })()'));

const rows = JSON.parse(String(await evalIn('JSON.stringify(window.__r75.rows)')));
if (!rows.length) { console.error('VOID RUN: the sampler never saw the header — check the page reloaded'); process.exit(1); }
// The sampler runs before the page's own scripts, so its earliest rows are the frames that matter.
// A row is "visible to the user" when it is laid out, not hidden, not transparent, and has buttons.
const isUp = (r) => r.disp !== 'none' && r.vis !== 'hidden' && Number(r.opa) > 0.05 && r.kids > 0 && r.w > 0;
const up = rows.filter(isUp);
console.log(`\n${rows.length} frames sampled, ${up.length} of them with the header icon row painted`);
const show = (r) => `  t=${String(r.t).padStart(5)} ${r.ready.padEnd(9)} disp=${r.disp.padEnd(5)} vis=${r.vis.padEnd(7)} opa=${String(r.opa).padEnd(4)} `
    + `${r.w}x${r.h} @${r.left},${r.top} collapsed=${r.collapsed ? 1 : 0} boot=${r.boot ? 1 : 0} touchUi=${r.touchUi ? 1 : 0}`;
for (const r of rows.slice(0, 14)) console.log(show(r));
if (up.length) {
    console.log('\nfirst painted-row frames:');
    for (const r of up.slice(0, 10)) console.log(show(r));
    const span = up[up.length - 1].t - up[0].t;
    console.log(`\nrow stood painted from ${up[0].t} ms to ${up[up.length - 1].t} ms (${span} ms wall, ${up.length} frames)`);
}
console.log(`\nVERDICT: ${up.length ? 'FLASH PRESENT' : 'never painted'}`);
ws.close();
