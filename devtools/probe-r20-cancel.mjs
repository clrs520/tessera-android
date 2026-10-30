// Cancel a long export mid-run and check the file it left behind is still playable.
// usage: node devtools/cdp-eval.mjs --file devtools/probe-r20-cancel.mjs
(async () => {
    const DIR = '/storage/emulated/0/TeslaCam/RecentClips';
    const OUT = '/storage/emulated/0/Download/r20-cancel.mp4';
    const SEG = 3000000;

    window.__exp3 = [];
    window.__tdashcamExportProgress = (p) => { if (p.id === 3) window.__exp3.push(p); };

    const native = window.TDashcamNative;
    if (!native || typeof native.cancelExport !== 'function') {
        return JSON.stringify({ fatal: 'no cancelExport' });
    }

    const request = {
        id: 3,
        outPath: OUT,
        width: 1280,
        height: 720,
        fps: 30,
        // Long enough that the cancel lands well before the last frame.
        durationUs: SEG * 8,
        rows: 1,
        cols: 1,
        cameras: [{
            camera: 'front',
            cell: 0,
            segments: [
                { path: `${DIR}/2026-10-08_09-00-00-front.mp4`, clipStartUs: 0, clipEndUs: SEG * 4, globalStartUs: 0 },
                { path: `${DIR}/2026-10-08_09-06-00-front.mp4`, clipStartUs: 0, clipEndUs: SEG * 4, globalStartUs: SEG * 4 },
            ],
        }],
    };

    const started = native.startExport(JSON.stringify(request));
    await new Promise((r) => setTimeout(r, 2500));
    const cancelled = native.cancelExport(3);
    await new Promise((r) => setTimeout(r, 2500));

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = getStreamUrl(OUT);
    const meta = await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve('meta');
        video.onerror = () => resolve('error ' + (video.error ? video.error.code : '?'));
        setTimeout(() => resolve('timeout'), 9000);
    });
    const info = {
        started, cancelled, meta,
        size: `${video.videoWidth}x${video.videoHeight}`,
        duration: Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : video.duration,
        events: window.__exp3.slice(-3),
    };
    video.src = '';
    return JSON.stringify(info, null, 2);
})()
