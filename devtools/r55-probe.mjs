const P = `(() => {
  const sb = document.querySelector('.sidebar');
  if (!sb) return JSON.stringify({err:'no sidebar'});
  const kids = [...sb.children].map(el => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { cls: el.className || el.id, disp: cs.display, y: Math.round(r.top), h: Math.round(r.height) };
  });
  const hdr = sb.querySelector('.sidebar-header');
  const row = document.querySelector('.event-search-row');
  return JSON.stringify({
    viewer: typeof window.viewer,
    cls: document.documentElement.className,
    w: window.innerWidth, hh: window.innerHeight, dpr: devicePixelRatio,
    sidebarCls: sb.className, sbDisp: getComputedStyle(sb).display, sbDir: getComputedStyle(sb).flexDirection,
    hdrPadTop: getComputedStyle(hdr).paddingTop, hdrH: Math.round(hdr.getBoundingClientRect().height),
    rowY: Math.round(row.getBoundingClientRect().top), rowH: Math.round(row.getBoundingClientRect().height),
    safeTop: getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),
    fieldH: getComputedStyle(document.documentElement).getPropertyValue('--field-h'),
    kids
  }, null, 1);
})()`;
import { spawn } from 'child_process';
const ADB = 'C:\\\\Users\\\\Xingcong\\\\AppData\\\\Local\\\\Android\\\\Sdk\\\\platform-tools\\\\adb.exe';
const run = (...a) => new Promise(r => { let o = ''; const p = spawn(ADB, a); p.stdout.on('data', d => o += d); p.on('close', () => r(o)); });
await run('-s', 'emulator-5554', 'forward', '--remove-all');
const pid = (await run('-s', 'emulator-5554', 'shell', 'pidof', '-s', 'com.tdashcam.studio')).trim();
await run('-s', 'emulator-5554', 'forward', 'tcp:9333', `localabstract:webview_devtools_remote_${pid}`);
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise(r => ws.onopen = r);
const evaluate = async expr => {
  const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (m.exceptionDetails) return 'EX ' + JSON.stringify(m.exceptionDetails).slice(0, 500);
  return m.result && m.result.result ? m.result.result.value : JSON.stringify(m).slice(0, 500);
};
await send('Runtime.enable');
console.log(await evaluate(P));
ws.close();
