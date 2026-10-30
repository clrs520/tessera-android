// Structural + pixel check for one exported MP4, played through the app's own loopback stream
// server (the only way a release WebView can read a local file). Reports dimensions, duration,
// and the mean luma of each grid cell at one frame, so an empty cell shows up as pure black.
//
//   node devtools/cdp-eval.mjs --file devtools/probe-r21-playback.mjs
(() => {
  const TARGET = '/storage/emulated/0/Download/TDashcam_2026-10-08_09-00-00_6c_912x1350.mp4';
  const CELLS = [[0,0,456,450],[456,0,456,450],[0,450,456,450],[456,450,456,450],[0,900,456,450],[456,900,456,450]];

  const base = [...document.querySelectorAll('video')].map((v) => v.src)
      .find((src) => src.startsWith('http://127.0.0.1:'));
  if (!base) return JSON.stringify({ error: 'no playing video to take the stream base from' });
  const head = base.slice(0, base.indexOf('/media/') + '/media/'.length);
  const token = base.slice(head.length).split('/')[0];
  const b64url = (text) => btoa(unescape(encodeURIComponent(text)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = `${head}${token}/${b64url(TARGET)}`;

  const video = document.createElement('video');
  video.muted = true;
  video.crossOrigin = 'anonymous';
  video.src = url;
  const wait = (event) => new Promise((resolve, reject) => {
    const done = () => { cleanup(); resolve(); };
    const fail = (e) => { cleanup(); reject(new Error(event + ' failed')); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error(event + ' timed out')); }, 7000);
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener(event, done);
      video.removeEventListener('error', fail);
    };
    video.addEventListener(event, done);
    video.addEventListener('error', fail);
  });

  return (async () => {
    await wait('loadedmetadata');
    const size = [video.videoWidth, video.videoHeight];
    const duration = Number(video.duration?.toFixed?.(2) ?? -1);
    // `seeked` fires before a frame is actually decoded on this WebView, which draws a black
    // canvas and would look like an empty cell, so let it run a moment and stop on a real frame.
    video.currentTime = Math.min(3, duration / 2);
    await video.play().catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 1200));
    video.pause();
    await new Promise((resolve) => setTimeout(resolve, 150));
    const ready = video.readyState;
    const canvas = document.createElement('canvas');
    canvas.width = size[0];
    canvas.height = size[1];
    canvas.getContext('2d').drawImage(video, 0, 0, size[0], size[1]);
    const cells = CELLS.map(([x, y, w, h]) => {
      const data = canvas.getContext('2d').getImageData(x, y, w, h).data;
      let sum = 0;
      let nonBlack = 0;
      for (let i = 0; i < data.length; i += 4) {
        const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        sum += luma;
        if (luma > 8) nonBlack++;
      }
      return { rect: [x, y, w, h], mean: Math.round(sum / (data.length / 4)),
          litRatio: Number((nonBlack / (data.length / 4)).toFixed(3)) };
    });
    video.src = '';
    return JSON.stringify({ size, duration, ready, at: Number(video.currentTime.toFixed(2)), cells }, null, 1);
  })().catch((e) => JSON.stringify({ error: String(e.message || e), url }));
})();
