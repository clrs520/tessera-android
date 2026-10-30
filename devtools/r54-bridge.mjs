// R54 acceptance: every void bridge call must still reach the shell with the same arguments, now
// that the 14 hand-written guard-and-try blocks go through `nativeFire`. The shell object is swapped
// for a recorder so the assertions are deterministic; three sites are then re-run against the real
// bridge (see r54-effects.sh) because a recorder cannot prove the device reacted.
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
    const names = ['scanMediaFile', 'vibrate', 'requestVolumeCounts', 'openExternal',
        'setKeepScreenOn', 'setAudioFocus', 'requestThumb', 'setFullscreen', 'setLightSystemBars',
        'setBackLayers', 'openStorageSettings', 'cancelExport', 'requestNotificationPermission',
        'exportStatusSeen', 'pageReady'];
    const real = window.TDashcamNative;
    const calls = [];
    const rec = {};
    names.forEach((n) => {
        rec[n] = (...a) => calls.push(n + '(' + a.map((x) => String(x)).join(',') + ')');
    });
    const threw = [];
    const t = (label, fn) => { try { fn(); } catch (e) { threw.push(label + ': ' + e.message); } };

    window.TDashcamNative = rec;
    t('notifyMediaFile', () => notifyMediaFile('/sdcard/x.mp4'));
    t('haptic(success)', () => haptic('success'));
    t('openExternalUrl', () => openExternalUrl('https://example.com'));
    t('setNativeKeepScreenOn', () => setNativeKeepScreenOn(true));
    t('setNativeAudioFocus', () => setNativeAudioFocus(true));
    t('requestVolumeCounts', () => nativeFire('requestVolumeCounts'));
    t('requestThumb', () => nativeFire('requestThumb', 'id1', '/a/b.mp4', 1200, 160));
    t('openStorageSettings', () => nativeFire('openStorageSettings'));
    t('pageReady', () => nativeFire('pageReady'));
    t('exportStatusSeen', () => nativeFire('exportStatusSeen'));
    t('applyTheme', () => window.viewer && window.viewer.applyTheme(
        document.body.classList.contains('dark-theme')));
    t('fullscreen on', () => window.viewer && window.viewer.setPhoneFullscreen(true));
    t('fullscreen off', () => window.viewer && window.viewer.setPhoneFullscreen(false));
    t('cancelExport(no job)', () => window.viewer && window.viewer.cancelPhoneExport());
    const unknown = (() => { try { return nativeFire('definitelyNotAmethod'); } catch (e) { return 'THREW'; } })();
    const peJob = window.viewer && window.viewer.peJob ? window.viewer.peJob.id : null;
    if (peJob != null) t('cancelExport(job)', () => window.viewer.cancelPhoneExport());

    // A shell with no bridge must send the callers down their fallback, not swallow the gesture.
    window.TDashcamNative = null;
    const noBridge = {
        fire: (() => { try { return nativeFire('setKeepScreenOn', true); } catch (e) { return 'THREW'; } })(),
        open: (() => { try { return openExternalUrl('https://example.com'); } catch (e) { return 'THREW'; } })()
    };
    window.TDashcamNative = real;

    const cache = (() => {
        try { return JSON.parse(localStorage.getItem('__tdashcam_storage') || '{}'); } catch (e) { return {}; }
    })();
    return JSON.stringify({
        ver: cache.version || null,
        alive: typeof window.viewer,
        bridgeRestored: window.TDashcamNative === real && !!real,
        exportDirField: cache.export_dir === undefined ? 'absent' : cache.export_dir,
        downloadDir: (typeof androidDownloadDir === 'function') ? androidDownloadDir() : 'no fn',
        nativeFireKnownFalse: unknown === false,
        noBridgeFalse: noBridge.fire === false && noBridge.open === false,
        peJobIdAtCancel: peJob,
        calls: calls,
        threw: threw,
        stillFullscreen: document.body.classList.contains('phone-fullscreen')
    });
})()`;

await send('Runtime.enable');
console.log(await evaluate(PROBE));
ws.close();
