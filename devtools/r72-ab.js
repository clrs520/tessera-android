// R72 on-device A/B: same MP4, native Rust walk vs the shipped JS parser, in one page. Proves the
// two agree point-by-point on the phone (not just on the host harness) and puts a real millisecond
// number on both paths.
//
// Set window.__r72abNeedle to a folder name to point it at another event; it defaults to the SEI
// fixture. Real clips carry no SEI, so their value here is the cost, not the content.
//
// Fire-and-forget: the first call returns "started", later calls read the stored result. An awaited
// CDP probe usually times out on the emulator even though the work finished.
(() => {
    const needle = window.__r72abNeedle || '2026-10-09_09-00-00';
    const KEY = '__r72ab_' + needle.replace(/[^0-9a-zA-Z]/g, '');
    if (window[KEY]) return JSON.stringify(window[KEY]);
    window[KEY] = { running: true };

    (async () => {
        const mm = viewer.metadataManager;
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        for (let i = 0; i < 60 && !mm.SeiMetadata; i++) await wait(100);
        if (!mm.SeiMetadata) { window[KEY] = { error: 'protobuf never became ready' }; return; }

        const files = viewer.allFiles
            .filter(f => f.path && f.path.indexOf(needle) >= 0)
            .sort((a, b) => a.path.localeCompare(b.path));
        if (!files.length) {
            window[KEY] = { error: 'no file matched', needle, all: viewer.allFiles.length };
            return;
        }

        const num = (d, k) => { const n = Number(d[k]); return Number.isFinite(n) ? n : null; };
        const rows = [];

        for (const file of files) {
            const t0 = performance.now();
            const items = await nativeInvoke('read_sei_metadata', { path: file.path });
            const tNative = performance.now() - t0;
            const native = mm.decodeSeiItems(items.map(i => ({ time: i.time, data: new Uint8Array(i.payload) })));

            const t1 = performance.now();
            const buffer = await (await fetch(getFileUrl(file))).arrayBuffer();
            const raw = new DashcamMP4(buffer).parseMetadata();
            const tJs = performance.now() - t1;
            const js = mm.decodeSeiItems(raw);

            const row = {
                camera: file.path.split('-').slice(-1)[0].replace('.mp4', ''),
                bytes: buffer.byteLength,
                nativeCount: native.length, jsCount: js.length,
                nativeMs: Math.round(tNative * 10) / 10, jsMs: Math.round(tJs * 10) / 10,
            };
            if (native.length !== js.length) {
                row.mismatch = `count ${native.length} vs ${js.length}`;
                rows.push(row);
                continue;
            }
            let worstDt = 0, badDecode = -1;
            for (let i = 0; i < native.length; i++) {
                worstDt = Math.max(worstDt, Math.abs(native[i].time - js[i].time));
                if (badDecode < 0 && JSON.stringify(native[i].data) !== JSON.stringify(js[i].data)) badDecode = i;
            }
            row.worstDt = worstDt;
            row.firstBadDecode = badDecode;
            if (badDecode >= 0) {
                row.nativeSample = native[badDecode].data;
                row.jsSample = js[badDecode].data;
            }
            const mid = native[native.length >> 1];
            if (mid) {
                row.spot = {
                    at: native.length >> 1, time: mid.time,
                    speed: num(mid.data, 'vehicleSpeedMps'), lat: num(mid.data, 'latitudeDeg'),
                    ap: mid.data.autopilotState
                };
            }
            rows.push(row);
        }

        const ok = (r) => r.worstDt === 0 && r.firstBadDecode < 0 && !r.mismatch;
        const slowest = rows.reduce((a, b) => (b.jsMs > a.jsMs ? b : a), rows[0]);
        window[KEY] = {
            needle, files: rows.length,
            bitExact: rows.every(ok),
            slowest: slowest && { camera: slowest.camera, bytes: slowest.bytes, jsMs: slowest.jsMs, nativeMs: slowest.nativeMs },
            speedupSlowest: slowest ? Math.round(slowest.jsMs / Math.max(0.1, slowest.nativeMs) * 10) / 10 : null,
            totals: rows.reduce((a, r) => ({ native: a.native + r.nativeMs, js: a.js + r.jsMs }), { native: 0, js: 0 }),
            rows,
        };
    })().catch(e => { window[KEY] = { error: String((e && e.stack) || e) }; });

    return 'started for ' + needle;
})()
