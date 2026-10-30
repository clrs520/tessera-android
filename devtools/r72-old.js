// R72 baseline for the OLD path, captured on the installed 1.2.105 (JS fetch + DashcamMP4) before
// the native reader ships. Same fixture, same six files, cache evicted so every number is a cold
// read. Re-run devtools/r72-ab.js after installing to compare against the native walk.
//
// Fire-and-forget: first call returns "started", later calls read window.__r72old.
(() => {
    if (window.__r72old) return JSON.stringify(window.__r72old);
    window.__r72old = { running: true };

    (async () => {
        const mm = viewer.metadataManager;
        const wait = (ms) => new Promise(r => setTimeout(r, ms));
        for (let i = 0; i < 60 && !mm.SeiMetadata; i++) await wait(100);
        if (!mm.SeiMetadata) { window.__r72old = { error: 'protobuf never became ready' }; return; }

        const files = viewer.allFiles
            .filter(f => f.path && f.path.indexOf('2026-10-09_09-00-00') >= 0)
            .sort((a, b) => a.path.localeCompare(b.path));
        if (!files.length) { window.__r72old = { error: 'fixture not loaded' }; return; }

        const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
        const rows = [];
        for (const file of files) {
            MetadataManager.seiCache.delete(file.path);
            const t0 = performance.now();
            const tele = await mm.readTelemetry(file);
            const ms = performance.now() - t0;
            const mid = tele[tele.length >> 1];
            rows.push({
                camera: file.path.split('-').slice(-1)[0].replace('.mp4', ''),
                count: tele.length,
                ms: Math.round(ms * 10) / 10,
                t0: tele[0] && tele[0].time,
                t1: tele[1] && tele[1].time,
                times: tele.slice(0, 6).map(x => x.time),
                midTime: mid && mid.time,
                speed: mid && num(mid.data.vehicle_speed_mps),
                lat: mid && num(mid.data.latitude_deg),
                lon: mid && num(mid.data.longitude_deg),
                heading: mid && num(mid.data.heading_deg),
                ap: mid && mid.data.autopilot_state,
                gear: mid && mid.data.gear_state,
            });
        }
        window.__r72old = { version: 'old-js-path', files: rows.length, rows };
    })().catch(e => { window.__r72old = { error: String(e && e.stack || e) }; });

    return 'started';
})()
