// After the change: same loop as r73-export-base.js, plus proof of *which* reader answered.
// Counts native `read_sei_metadata` calls and whole-file fetches so a silent fall-back is visible.
(function () {
  window.__r73a = { running: true };
  (async () => {
    const CAMS = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
    const PASSES = 3;
    const out = { cameras: {}, shape: {} };
    const realInvoke = window.nativeInvoke;
    const realFetch = window.fetch;
    let nativeCalls = 0;
    let fetchBytes = 0;
    try {
      const event = viewer.currentEvent;
      if (!event) { out.error = 'no event loaded'; window.__r73a = out; return; }
      const durs = event.segmentDurations || [];
      const clipSegments = event.segments.map((seg, i) => ({
        segment: seg,
        clipStart: event.segmentStartTimes?.[i] ?? i * 60,
        clipEnd: (event.segmentStartTimes?.[i] ?? i * 60) + (durs[i] || 60),
      }));
      out.segmentCount = clipSegments.length;
      const proc = viewer.videoClipProcessor;
      proc.metadataManager = viewer.metadataManager;
      proc.isCancelled = false;

      window.nativeInvoke = function (cmd, args) {
        if (cmd === 'read_sei_metadata') nativeCalls++;
        return realInvoke.call(this, cmd, args);
      };
      window.fetch = function () {
        return realFetch.apply(this, arguments).then(res => {
          const clone = res.clone();
          clone.arrayBuffer().then(b => { fetchBytes += b.byteLength; }).catch(() => {});
          return res;
        });
      };

      for (let pass = 0; pass < PASSES; pass++) {
        for (const cam of CAMS) {
          MetadataManager.seiCache.clear();               // cold, like a real export
          fetchBytes = 0;
          const t0 = performance.now();
          const meta = await proc.loadMetadataForSegments(clipSegments, cam, null);
          const ms = performance.now() - t0;
          const pts = meta.reduce((n, s) => n + s.metadata.length, 0);
          const seg0 = meta[0] && meta[0].metadata[0];
          const slot = out.cameras[cam] || (out.cameras[cam] = {
            ms: [], points: [],
            firstTime: seg0 ? seg0.time : null,
            firstSpeed: seg0 ? Number(seg0.data.vehicleSpeedMps) : null,
            fields: seg0 ? Object.keys(seg0.data).length : 0,
            gear: seg0 ? String(seg0.data.gearState) : null,
            ap: seg0 ? String(seg0.data.autopilotState) : null,
            lat: seg0 ? Number(seg0.data.latitudeDeg) : null,
            nativeCalls: 0, fetchedBytes: 0,
          });
          slot.ms.push(+ms.toFixed(1));
          slot.points.push(pts);
          slot.nativeCalls += nativeCalls; nativeCalls = 0;
          slot.fetchedBytes += fetchBytes; fetchBytes = 0;
        }
      }
      for (const cam of CAMS) {
        const c = out.cameras[cam];
        const s = c.ms.slice().sort((a, b) => a - b);
        c.median = s[(s.length - 1) >> 1];
      }
      out.sumMedian = +CAMS.reduce((a, c) => a + out.cameras[c].median, 0).toFixed(1);
      out.touchShell = isTouchShellRuntime();
    } catch (e) {
      out.threw = String(e && e.stack || e);
    } finally {
      window.nativeInvoke = realInvoke;
      window.fetch = realFetch;
    }
    out.running = false;
    window.__r73a = out;
  })();
  return 'armed';
})()
