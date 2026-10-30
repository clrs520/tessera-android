// Temporary diagnostic: log every pointerup on #playerArea with the double-tap zone's own inputs,
// so a missing ±10s jump can be told apart from a missing pairing.
const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const PORT = 9333;
const { execFileSync } = await import('node:child_process');
const pid = execFileSync(ADB, ['shell', 'pidof', 'com.tdashcam.studio'], { encoding: 'utf8' }).trim();
execFileSync(ADB, ['forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);
const page = (await fetch(`http://127.0.0.1:${PORT}/json`).then(r => r.json())).find(p => p.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('ws timeout')), 8000); ws.addEventListener('open', () => { clearTimeout(t); res(); }); });
let id = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
const send = (method, params) => new Promise(r => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return r.result?.value ?? r.exceptionDetails?.exception?.description ?? r;
};

console.log(await ev(`(() => {
    window.__up = [];
    const v = viewer;
    document.getElementById('playerArea').addEventListener('pointerup', (e) => {
        const box = v.dom.playerArea.getBoundingClientRect();
        window.__up.push({
            x: Math.round(e.clientX), y: Math.round(e.clientY),
            tgt: e.target.tagName + '#' + (e.target.id || ''),
            phone: typeof isPhoneLayout === 'function' ? isPhoneLayout() : 'no-fn',
            lm: v.multiCameraPlayer.layoutMode,
            ev: !!v.currentEvent, block: v.blocksFeedGesture(e.target),
            supp: Math.max(0, (v.suppressPlayerTapUntil || 0) - Date.now()),
            rel: Math.round(e.clientX - box.left), bw: Math.round(box.width),
        }, true);
    }, true);
    return 'armed';
})()`));

const { spawnSync } = await import('node:child_process');
const n = Number(process.argv[2] || 2);
const x = Number(process.argv[3] || 750);
const y = Number(process.argv[4] || 160);
const cmds = [];
for (let i = 0; i < n; i++) cmds.push(`input tap ${Math.round(x * 2.625)} ${Math.round(y * 2.625)}`);
spawnSync(ADB, ['-s', 'emulator-5554', 'shell', cmds.join('; ')], { shell: true });

console.log(await ev(`JSON.stringify({ups:(window.__up||[]).slice(0,8),t:Math.round(viewer.videoControls.continuousPlayer.getCurrentTime()*10)/10,chip:document.getElementById('phoneFeedValue').textContent},null,1)`));
ws.close();
