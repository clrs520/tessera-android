// Start a hand-written export job straight through the native bridge, before the UI exists.
// usage: node devtools/cdp-eval.mjs --file devtools/.probe-r19-export.js
(async () => {
    const SRC = '/storage/emulated/0/TeslaCam/RecentClips/2026-10-08_09-00-00-front.mp4';
    const OUT = '/storage/emulated/0/Download/r19-test.mp4';
    const SEG = 3000000;

    window.__exp = [];
    window.__tdashcamExportProgress = (p) => { window.__exp.push(p); };

    const native = window.TDashcamNative;
    if (!native || typeof native.startExport !== 'function') {
        return JSON.stringify({ fatal: 'no startExport on TDashcamNative', keys: native ? Object.keys(native).slice(0, 20) : null });
    }

    const request = {
        id: 1,
        outPath: OUT,
        width: 640,
        height: 360,
        fps: 30,
        durationUs: SEG * 2,
        rows: 1,
        cols: 1,
        bitrateKbps: 3000,
        preferHardware: true,
        cameras: [
            {
                camera: 'front',
                cell: 0,
                segments: [
                    { path: SRC, clipStartUs: 0, clipEndUs: SEG, globalStartUs: 0 },
                    { path: SRC, clipStartUs: SEG, clipEndUs: SEG * 2, globalStartUs: SEG },
                ],
            },
        ],
    };

    const started = native.startExport(JSON.stringify(request));
    return JSON.stringify({
        started,
        codecs: native.exportCodecReport(640, 360),
        events: window.__exp.slice(),
    }, null, 2);
})()
