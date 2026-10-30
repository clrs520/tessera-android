// Open the fixture event and report decode health of all six feeds.
window.__r73 = { started: Date.now() };
(async () => {
  const out = { cameras: {}, errors: [] };
  try {
    const id = 'TeslaCam/SavedClips/2026-10-09_09-00-00';
    viewer.playEvent(id);
    await new Promise(r => setTimeout(r, 1500));
    if (typeof viewer.setLayout === 'function') viewer.setLayout('grid6');
    out.eventLoaded = !!(viewer.currentEvent || viewer.activeEventId);
    out.totalDuration = viewer.currentClipDuration || viewer.totalDuration || null;
    // let the players attach and attempt decode
    for (let t = 0; t < 24; t++) {
      await new Promise(r => setTimeout(r, 500));
      const vids = Array.from(document.querySelectorAll('video'));
      const allReady = vids.length >= 6 && vids.every(v => v.readyState >= 2 || v.error);
      if (allReady) break;
    }
    const vids = Array.from(document.querySelectorAll('video'));
    out.videoCount = vids.length;
    for (const v of vids) {
      const key = v.dataset && v.dataset.camera ? v.dataset.camera : (v.src || '').split('/').pop();
      out.cameras[key] = {
        readyState: v.readyState,
        err: v.error ? v.error.code : null,
        errMsg: v.error ? v.error.message : null,
        dur: isFinite(v.duration) ? +v.duration.toFixed(3) : null,
        w: v.videoWidth, h: v.videoHeight,
      };
    }
    // any visible "decode failed" labels in the DOM
    out.decodeFailLabels = Array.from(document.querySelectorAll('*'))
      .filter(e => e.children.length === 0 && /解码失败|Decode failed|无法播放/.test(e.textContent || ''))
      .map(e => ({ text: (e.textContent || '').trim(), cls: e.className, visible: !!(e.offsetParent) }));
    const mm = viewer.metadataManager;
    const file = (viewer.currentEvent && viewer.currentEvent.segments &&
      viewer.currentEvent.segments[0] && viewer.currentEvent.segments[0].files) ? viewer.currentEvent.segments[0].files.front : null;
    if (file) {
      const t0 = performance.now();
      const tel = await mm.readTelemetry(file);
      out.telemetry = { count: tel.length, ms: +(performance.now() - t0).toFixed(1),
        firstTime: tel[0] ? tel[0].time : null, mid: tel[75] ? tel[75].data.vehicleSpeedMps : null };
    } else out.telemetry = 'no front file';
  } catch (e) {
    out.threw = String(e && e.stack || e);
  }
  window.__r73.done = out;
})();
'started'
