// Prove the prefers-reduced-motion block actually applies: CDP can emulate the media feature,
// which the emulator's own animation-scale toggles do not drive on this WebView build.
const PORT = 9333;

const pages = await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) })
    .then((r) => r.json());
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
ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
});
function send(method, params = {}) {
    const id = ++seq;
    const p = new Promise((res, rej) => pending.set(id, { res, rej }));
    ws.send(JSON.stringify({ id, method, params }));
    return p;
}
async function evaluate(expression) {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'threw');
    return r.result.value;
}

const PROBE = `(() => {
    const el = document.getElementById('androidDirModal');
    return {
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        modalTransition: getComputedStyle(el).transitionDuration, graphTransition: getComputedStyle(document.querySelector('.speed-graph-container')).transitionDuration,
        cardTransition: getComputedStyle(document.querySelector('.video-card') || document.body).transitionDuration,
    };
})()`;

await send('Runtime.enable');
console.log('off   ', JSON.stringify(await evaluate(PROBE)));
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
console.log('reduce', JSON.stringify(await evaluate(PROBE)));
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
console.log('back  ', JSON.stringify(await evaluate(PROBE)));
ws.close();
