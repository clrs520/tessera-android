// Does the fixture content change over time? Needed to tell a working seek from a clip that
// quietly started at 0. usage: node devtools/cdp-eval.mjs --file devtools/probe-r21-source-scan.mjs
(async () => {
    const path = '/storage/emulated/0/TeslaCam/RecentClips/2026-10-08_09-00-00-front.mp4';
    const times = [0.2, 3, 6, 9, 12, 15];
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

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const out = [];
    for (const t of times) {
        video.currentTime = t;
        const ok = await new Promise((resolve) => {
            video.onseeked = () => resolve(true);
            setTimeout(() => resolve(false), 8000);
        });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let total = 0;
        let peak = 0;
        for (let i = 0; i < data.length; i += 4) {
            const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
            total += luma;
            if (luma > peak) peak = luma;
        }
        out.push(`${t}:${ok ? Math.round(total / (data.length / 4)) : 'seek-fail'}/${peak}`);
    }
    video.src = '';
    return JSON.stringify({
        duration: Number(video.duration), size: `${video.videoWidth}x${video.videoHeight}`, means: out,
    });
})()
