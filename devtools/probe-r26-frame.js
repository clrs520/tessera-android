// R26-1 diagnosis: replay FrameFetcher.grab inline and report every media event.
(async () => {
    const path = viewer.videoListComponent.firstClipPath(viewer.eventGroups[0]);
    const log = [];
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    v.style.cssText = 'position:fixed;left:-4000px;top:0;width:160px;height:90px;';
    const done = new Promise(res => setTimeout(res, 12000));
    ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'seeked', 'error', 'stalled', 'waiting'].forEach(t => {
        v.addEventListener(t, () => log.push(t + (t === 'error' ? ':' + (v.error && v.error.code) : '')));
    });
    document.body.appendChild(v);
    v.src = getFileUrl({ path });
    await new Promise(r => { v.onloadeddata = r; setTimeout(r, 9000); });
    log.push('meta:' + v.videoWidth + 'x' + v.videoHeight + ' dur=' + v.duration);
    try {
        v.currentTime = Math.max(0, Math.min(1, v.duration - 0.25));
    } catch (e) { log.push('seek-threw:' + e.message); }
    await new Promise(r => { v.onseeked = r; setTimeout(r, 6000); });
    const c = document.createElement('canvas');
    c.width = 160; c.height = 90;
    let out = {};
    try {
        c.getContext('2d').drawImage(v, 0, 0, 160, 90);
        out.dataUrl = c.toDataURL('image/jpeg', 0.62).slice(0, 40);
        out.len = c.toDataURL('image/jpeg', 0.62).length;
    } catch (e) { out.err = e.name + ': ' + e.message; }
    v.removeAttribute('src'); v.load(); v.remove();
    return JSON.stringify({ path: path.slice(-40), log, out, mediaError: v.error ? v.error.code : null }, null, 1);
})()
