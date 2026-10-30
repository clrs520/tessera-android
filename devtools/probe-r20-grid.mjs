// Two cameras into one 1x2 output: this is what proves the cell layout, not just one happy path.
// usage: node devtools/cdp-eval.mjs --file devtools/probe-r20-grid.mjs
(async () => {
    const DIR = '/storage/emulated/0/TeslaCam/RecentClips';
    const OUT = '/storage/emulated/0/Download/r20-grid.mp4';
    const TAKE = 4000000;

    const clip = (name, offset) => ({
        path: `${DIR}/2026-10-08_09-00-00-${name}.mp4`,
        clipStartUs: offset,
        clipEndUs: offset + TAKE,
        globalStartUs: offset,
    });

    const request = {
        id: 2,
        outPath: OUT,
        width: 1280,
        height: 720,
        fps: 30,
        durationUs: TAKE,
        rows: 1,
        cols: 2,
        preferHardware: true,
        cameras: [
            { camera: 'front', cell: 0, segments: [clip('front', 0)] },
            { camera: 'back', cell: 1, segments: [clip('back', 0)] },
        ],
    };

    window.__exp2 = [];
    window.__tdashcamExportProgress = (p) => { if (p.id === 2) window.__exp2.push(p); };

    const native = window.TDashcamNative;
    if (!native || typeof native.startExport !== 'function') {
        return JSON.stringify({ fatal: 'no startExport' });
    }
    return JSON.stringify({ started: native.startExport(JSON.stringify(request)) });
})()
