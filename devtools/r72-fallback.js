// R72 fallback proof: make the native command fail on a file that *does* exist, then show that
// readTelemetry still returns the full JS-parsed answer. A missing file is not a test — the JS
// path 404s there too, so it only proves `null`, not that telemetry survived.
(() => {
    window.__r72fb = { running: true };
    (async () => {
        const mm = viewer.metadataManager;
        const file = viewer.allFiles.find(f => f.path && f.path.indexOf('2026-10-09_09-00-00') >= 0
            && f.path.indexOf('front') >= 0);
        if (!file) { window.__r72fb = { error: 'fixture front not indexed' }; return; }

        MetadataManager.seiCache.delete(file.path);
        const real = window.nativeInvoke;
        window.nativeInvoke = () => Promise.reject(new Error('forced native failure'));
        let forced = null;
        try {
            forced = await mm.readTelemetryNative(file);
            const viaReader = await mm.readTelemetry(file);
            window.__r72fb = {
                nativeWhileBroken: forced,
                readerCount: viaReader.length,
                firstTime: viaReader[0] && viaReader[0].time,
                midSpeed: viaReader[75] && Number(viaReader[75].data.vehicleSpeedMps),
                restored: typeof window.nativeInvoke === 'function' && window.nativeInvoke === real,
            };
        } catch (e) {
            window.__r72fb = { error: String(e.message || e) };
        } finally {
            window.nativeInvoke = real;
        }
        // And the real command works again after restoring the reference.
        try {
            const items = await real('read_sei_metadata', { path: file.path });
            window.__r72fb.nativeAfterRestore = Array.isArray(items) ? items.length : String(items);
        } catch (e) {
            window.__r72fb.nativeAfterRestore = 'threw ' + e.message;
        }
    })().catch(e => { window.__r72fb = { error: String((e && e.stack) || e) }; });
    return 'started';
})()
