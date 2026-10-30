(function () {
  const p = window.__r73file && window.__r73file.path;
  if (!p) return 'set window.__r73file.path first';
  let v = document.getElementById('r73probe');
  if (!v) {
    v = document.createElement('video');
    v.id = 'r73probe';
    v.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain;background:#000;z-index:99999';
    document.body.appendChild(v);
  }
  window.__r73show = { state: 'loading' };
  v.onloadedmetadata = () => { window.__r73show.meta = { w: v.videoWidth, h: v.videoHeight, dur: v.duration }; v.currentTime = 3.0; };
  v.onseeked = () => { window.__r73show.state = 'seeked'; };
  v.onerror = () => { window.__r73show.state = 'error:' + (v.error && v.error.code); };
  v.src = getFileUrl({ path: p, name: p.split('/').pop() });
  v.load();
  return 'armed';
})()
