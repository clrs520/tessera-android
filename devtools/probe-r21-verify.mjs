// Verify the sheet-driven export: 1x3 grid, so the block map should show three distinct columns.
// usage: node devtools/cdp-eval.mjs --file devtools/probe-r21-verify.mjs
(async () => {
    const path = '/storage/emulated/0/Download/TDashcam_2026-09-29_12-30-00_6c_480x710.mp4';
    const url = typeof getStreamUrl === 'function' ? getStreamUrl(path) : null;
    if (!url) return JSON.stringify({ fatal: 'no stream url' });

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = url;
    const meta = await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve('meta');
        video.onerror = () => resolve('error ' + (video.error ? video.error.code : '?'));
        setTimeout(() => resolve('timeout'), 9000);
    });
    if (meta !== 'meta') return JSON.stringify({ meta });

    video.currentTime = 2;
    const seeked = await new Promise((resolve) => {
        video.onseeked = () => resolve('seeked');
        setTimeout(() => resolve('seek-timeout'), 9000);
    });

    const COLS = 6;
    const ROWS = 4;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const bw = Math.floor(canvas.width / COLS);
    const bh = Math.floor(canvas.height / ROWS);
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < COLS; c++) {
            const data = ctx.getImageData(c * bw, r * bh, bw, bh).data;
            let total = 0;
            let peak = 0;
            for (let i = 0; i < data.length; i += 4) {
                const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
                total += luma;
                if (luma > peak) peak = luma;
            }
            row.push(`${Math.round(total / (data.length / 4))}/${Math.round(peak)}`);
        }
        grid.push(row.join(' '));
    }
    const out = {
        meta, seeked, size: `${canvas.width}x${canvas.height}`,
        duration: Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : video.duration,
        grid,
    };
    video.src = '';
    return JSON.stringify(out, null, 1);
})()
