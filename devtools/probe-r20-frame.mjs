// Dump one exported frame as base64 JPEG so it can be looked at on the PC: numbers can say a
// picture is bright, only the eye can say it is upside down.
(async () => {
    const path = '/storage/emulated/0/Download/r20-grid.mp4';
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = getStreamUrl(path);
    const meta = await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve('meta');
        video.onerror = () => resolve('error');
        setTimeout(() => resolve('timeout'), 9000);
    });
    if (meta !== 'meta') return 'FATAL ' + meta;
    video.currentTime = 1.5;
    await new Promise((resolve) => {
        video.onseeked = resolve;
        setTimeout(resolve, 9000);
    });
    const width = 480;
    const height = Math.round(video.videoHeight * width / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    video.src = '';
    return canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
})()
