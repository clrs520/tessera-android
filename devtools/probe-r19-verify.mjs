// Verify a natively exported MP4 by playing it back inside the app's own WebView:
// resolution and duration come from the demuxer, and the pixels come from a canvas sample
// at 2 seconds — which is what tells a real picture from an all-black composite.
(async () => {
    const path = '/storage/emulated/0/Download/r19-test.mp4';
    const url = typeof getStreamUrl === 'function' ? getStreamUrl(path) : null;
    if (!url) return JSON.stringify({ fatal: 'no stream url', hasFn: typeof getStreamUrl });

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = url;
    const meta = await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve('meta');
        video.onerror = () => resolve('error ' + (video.error ? video.error.code : '?'));
        setTimeout(() => resolve('timeout'), 9000);
    });
    const info = {
        meta,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        duration: Number.isFinite(video.duration) ? Number(video.duration.toFixed(2)) : video.duration,
    };
    if (meta !== 'meta') return JSON.stringify(info);

    video.currentTime = 2;
    const seeked = await new Promise((resolve) => {
        video.onseeked = () => resolve('seeked');
        setTimeout(() => resolve('seek-timeout'), 9000);
    });
    info.seeked = seeked;
    info.currentTime = Number(video.currentTime.toFixed(2));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, video.videoWidth);
    canvas.height = Math.max(1, video.videoHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let min = 255;
    let max = 0;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
        const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (luma < min) min = luma;
        if (luma > max) max = luma;
        sum += luma;
        count++;
    }
    info.luma = { min: Math.round(min), max: Math.round(max), mean: Number((sum / count).toFixed(2)) };
    // Where in the frame the light is: a 1x1 grid of 4x4 blocks tells a misplaced cell from a
    // black one without shipping the whole picture back.
    const block = Math.floor(canvas.width / 4);
    const quad = [];
    for (let q = 0; q < 4; q++) {
        const bx = (q % 2) * block * 2;
        const by = Math.floor(q / 2) * block * 2;
        const sample = ctx.getImageData(bx, by, block, block).data;
        let total = 0;
        for (let i = 0; i < sample.length; i += 4) total += (sample[i] + sample[i + 1] + sample[i + 2]) / 3;
        quad.push(Number((total / (sample.length / 4)).toFixed(1)));
    }
    info.quadrants = quad;
    video.src = '';
    return JSON.stringify(info, null, 2);
})()
